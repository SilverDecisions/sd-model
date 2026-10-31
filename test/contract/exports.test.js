// Contract of the package entry points and bundle formats: the named exports
// consumers import (`import {DataModel, domain, ValidationResult} from
// 'sd-model'`, `require('sd-model').DataModel`), the globals of the dist bundles
// and the package metadata that browserify consumers depend on.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const loaded = require('./load');
const {model} = loaded;

const DOMAIN = ['Node', 'DecisionNode', 'ChanceNode', 'TerminalNode', 'Edge', 'Point', 'Text'];

test('exports: domain, DataModel, ValidationResult', () => {
    assert.deepEqual(Object.keys(model).sort(), ['DataModel', 'ValidationResult', 'domain']);
    assert.equal(model.__esModule, true);
    assert.equal(typeof model.DataModel, 'function');
    assert.equal(typeof model.ValidationResult, 'function');
    assert.deepEqual(Object.keys(model.domain).sort(), DOMAIN.slice().sort());
    for (const name of DOMAIN) {
        assert.equal(typeof model.domain[name], 'function', name);
    }
});

test('domain classes form the documented hierarchy', () => {
    const d = model.domain;
    for (const name of ['DecisionNode', 'ChanceNode', 'TerminalNode']) {
        assert.ok(new d[name]() instanceof d.Node, name);
    }
    // Node, Edge and Text are ObjectWithIdAndEditableFields (flag used by the
    // sd-computations job repository to serialize references by id)
    for (const o of [new d.DecisionNode(), new d.Edge(), new d.Text()]) {
        assert.equal(o.$ObjectWithIdAndEditableFields, true);
    }
    assert.equal(new d.Point().$ObjectWithIdAndEditableFields, undefined);
});

test('package.json keeps the entry points and the browserify transform of the consumers', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(loaded.root, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'sd-model');
    assert.equal(pkg.main, 'index.js');
    assert.equal(pkg.exports, undefined);
    assert.equal(pkg.type, undefined);
    assert.deepEqual(pkg.browserify, {
        transform: [['babelify', {
            presets: ['@babel/preset-env'],
            plugins: ['transform-class-properties', 'transform-object-assign',
                ['transform-builtin-extend', {globals: ['Error']}]]
        }]]
    });
    assert.ok(pkg.dependencies['sd-utils']);
    // sources consumers bundle (index.js -> src/), and the browser entry
    for (const file of ['index.js', 'browser.index.js', 'src/index.js', 'src/data-model.js', 'src/validation-result.js',
        'src/domain/index.js', 'src/domain/edge.js', 'src/domain/point.js', 'src/domain/text.js',
        'src/domain/object-with-computed-values.js', 'src/domain/object-with-id-and-editable-fields.js',
        'src/domain/node/node.js', 'src/domain/node/decision-node.js', 'src/domain/node/chance-node.js',
        'src/domain/node/terminal-node.js']) {
        assert.ok(fs.existsSync(path.join(loaded.root, file)), file);
    }
});

test('standalone bundle: UMD with the global SilverDecisions.Model', {skip: !/^standalone/.test(loaded.target) && 'standalone targets only'}, () => {
    const file = path.join(loaded.dist, 'standalone', 'sd-model' + (loaded.target.endsWith('.min') ? '.min' : '') + '.js');
    const code = fs.readFileSync(file, 'utf8');
    // script tag: no module / define, an existing SilverDecisions namespace is extended
    const sandbox = {SilverDecisions: {Other: 1}, Math, Date, JSON};
    sandbox.window = sandbox;
    vm.runInNewContext(code, sandbox, {filename: file});
    assert.equal(sandbox.SilverDecisions.Other, 1);
    assert.deepEqual(Object.keys(sandbox.SilverDecisions.Model).sort(), ['DataModel', 'ValidationResult', 'domain']);
    const dataModel = new sandbox.SilverDecisions.Model.DataModel();
    dataModel.addNode(new sandbox.SilverDecisions.Model.domain.DecisionNode());
    assert.equal(dataModel.getRoots().length, 1);
    // AMD: a minimal loader (the module value is the factory's return value or
    // the injected `exports` object)
    let defined;
    const define = (deps, factory) => {
        const exports = {};
        const result = factory.apply(null, deps.map(dep => {
            assert.equal(dep, 'exports', 'no other AMD dependencies');
            return exports;
        }));
        defined = deps.includes('exports') ? exports : result;
    };
    define.amd = {};
    vm.runInNewContext(code, {Math, Date, JSON, define}, {filename: file});
    assert.equal(typeof defined.DataModel, 'function');
    assert.equal(typeof defined.domain.ChanceNode, 'function');
});

test('module bundle: global require exposing sd-model, sd-utils taken from the previous require', {skip: !loaded.isModuleBundle && 'module targets only'}, () => {
    const req = loaded.globalRequire;
    assert.equal(req('sd-model'), model, 'evaluated once, cached');
    const {Utils} = req('sd-utils');
    // sd-utils is external: the model uses the instance of the sd-utils bundle
    const guid = Utils.guid;
    Utils.guid = () => 'from-sd-utils-bundle';
    try {
        assert.equal(new model.domain.Text().id, 'from-sd-utils-bundle');
    } finally {
        Utils.guid = guid;
    }
    assert.throws(() => req('no-such-module'), e => e.code === 'MODULE_NOT_FOUND');
    const file = path.join(loaded.dist, 'sd-model' + (loaded.target.endsWith('.min') ? '.min' : '') + '.js');
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /function guid\(|cloneDeepWith/, 'sd-utils / lodash not bundled');
});

test('module bundle: works when loaded before sd-utils and with a later require (job worker order)', {skip: !loaded.isModuleBundle && 'module targets only'}, () => {
    const file = path.join(loaded.dist, 'sd-model' + (loaded.target.endsWith('.min') ? '.min' : '') + '.js');
    // sd-model first, sd-utils afterwards: sd-model resolves sd-utils through the later global require
    const res = withFiles([file, loaded.sdUtilsBundle], (req) => {
        const dm = new (req('sd-model').DataModel)();
        dm.addNode(new (req('sd-model').domain.ChanceNode)());
        return dm.nodes.length;
    });
    assert.equal(res, 1);
});

function withFiles(files, fn) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'require');
    delete globalThis.require;
    try {
        for (const f of files) {
            vm.runInThisContext(fs.readFileSync(f, 'utf8'), {filename: f});
        }
        return fn(globalThis.require);
    } finally {
        if (previous) {
            Object.defineProperty(globalThis, 'require', previous);
        } else {
            delete globalThis.require;
        }
    }
}
