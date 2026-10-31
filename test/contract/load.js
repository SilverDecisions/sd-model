// Loads sd-model the way consumers get it and returns {target, model, ...}.
//
// SD_MODEL_TARGET selects what is tested (default: standalone):
//   standalone  dist/standalone/sd-model.js, UMD (CommonJS branch), sd-utils bundled
//   module      dist/sd-model.js, the bundle that defines a global `require` exposing
//               'sd-model' and takes 'sd-utils' from the `require` defined before it
//               (loaded after dist/sd-utils.js by the tests of sd-computations and
//               sd-tree-designer, also in the sd-computations job worker)
//   standalone.min, module.min   the minified files of the same bundles
//   source      index.js bundled with browserify and the package's own
//               browserify.transform, as SilverDecisions bundles the package
//   <file>      a CommonJS file exporting the module namespace, e.g. a bundle of
//               the installed package
// SD_MODEL_DIST points at another dist/ directory (default: ./dist).
// SD_UTILS_BUNDLE is the sd-utils `require` bundle loaded before the module
// bundle (default: dist/sd-utils.js of the installed sd-utils).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const target = process.env.SD_MODEL_TARGET || 'standalone';
const dist = path.resolve(root, process.env.SD_MODEL_DIST || 'dist');

// Runs the files in this realm with a fresh global `require` (the module
// bundles chain to it) and restores the previous global afterwards.
function withGlobalRequire(files, fn) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'require');
    delete globalThis.require;
    try {
        for (const file of files) {
            vm.runInThisContext(fs.readFileSync(file, 'utf8'), {filename: file});
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

function sdUtilsBundle() {
    if (process.env.SD_UTILS_BUNDLE) {
        return path.resolve(process.env.SD_UTILS_BUNDLE);
    }
    return path.join(path.dirname(require.resolve('sd-utils/package.json', {paths: [root]})), 'dist', 'sd-utils.js');
}

function loadModuleBundle(file) {
    return withGlobalRequire([sdUtilsBundle(), file], (globalRequire) => ({
        model: globalRequire('sd-model'),
        globalRequire
    }));
}

function loadSource() {
    const code = childProcess.execFileSync(process.execPath, [path.join(__dirname, 'bundle-source.js')], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });
    const module = {exports: {}};
    vm.runInThisContext('(function (module, exports) {' + code + '\n})', {filename: 'sd-model-source-bundle.js'})(module, module.exports);
    return module.exports;
}

function load() {
    const bundle = /^(standalone|module)(\.min)?$/.exec(target);
    if (bundle && bundle[1] === 'standalone') {
        return {target, model: require(path.join(dist, 'standalone', 'sd-model' + (bundle[2] || '') + '.js')), globalRequire: null};
    }
    if (bundle) {
        return Object.assign({target}, loadModuleBundle(path.join(dist, 'sd-model' + (bundle[2] || '') + '.js')));
    }
    if (target === 'source') {
        return {target, model: loadSource(), globalRequire: null};
    }
    return {target, model: require(path.resolve(target)), globalRequire: null};
}

const loaded = load();
loaded.isModuleBundle = /^module(\.min)?$/.test(target);
loaded.sdUtilsBundle = loaded.isModuleBundle ? sdUtilsBundle() : null;
loaded.loadModuleBundle = loadModuleBundle;
loaded.dist = dist;
loaded.root = root;
module.exports = loaded;
