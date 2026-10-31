// Contract of loading and saving: DataModel.load / serialize with saved
// SilverDecisions files (fixtures/), the JSON written for them, filtering of
// $-prefixed (transient) fields, the DTO used between SilverDecisions and the
// sd-computations worker, and updateFrom.
//
// Saved data is compared semantically with an expectation derived from the
// fixture and the file format (helpers.expectedData), and load -> save -> load
// -> save must be idempotent after the first (canonical) save. Byte identity
// with the original file is not required.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {model} = require('./load');
const {readFixture, FIXTURE_NAMES, checkIntegrity, countSubtree, expectedData, withoutGeneratedIds, GUID, mockRandom} = require('./helpers');

const {DataModel, ValidationResult, domain: d} = model;

function textIds(saved) {
    return saved.texts.map(t => t.id);
}

function withoutTextIds(saved) {
    return Object.assign({}, saved, {texts: saved.texts.map(t => ({value: t.value, location: t.location}))});
}

for (const name of FIXTURE_NAMES) {
    test('fixture ' + name + ': load gives the saved trees', (t) => {
        mockRandom(t, 11);
        const {data} = readFixture(name);
        const dm = new DataModel(data);
        const expectedCount = data.trees.map(countSubtree).reduce((a, c) => ({nodes: a.nodes + c.nodes, edges: a.edges + c.edges}), {nodes: 0, edges: 0});
        assert.equal(dm.nodes.length, expectedCount.nodes);
        assert.equal(dm.edges.length, expectedCount.edges);
        assert.equal(dm.getRoots().length, data.trees.length);
        assert.equal(dm.texts.length, (data.texts || []).length);
        checkIntegrity(assert, dm);
        for (const n of dm.nodes) {
            assert.ok(n instanceof {decision: d.DecisionNode, chance: d.ChanceNode, terminal: d.TerminalNode}[n.type], n.type);
            assert.ok(n.location instanceof d.Point);
        }
        for (const text of dm.texts) {
            assert.ok(text instanceof d.Text);
            assert.ok(text.location instanceof d.Point);
        }

        const saved = JSON.parse(dm.serialize());
        assert.deepEqual(withoutGeneratedIds(saved, data), expectedData(data));
        // ids of the file are kept (compared above), missing ones are generated
        for (const o of dm.nodes.concat(dm.edges, dm.texts)) {
            assert.equal(typeof o.id, 'string');
            assert.ok(o.id.length > 0);
        }
    });

    test('fixture ' + name + ': load -> save -> load -> save is idempotent', (t) => {
        mockRandom(t, 12);
        const {data} = readFixture(name);
        const first = new DataModel(data).serialize();
        const second = new DataModel(JSON.parse(first)).serialize();
        const a = JSON.parse(first);
        const b = JSON.parse(second);
        assert.deepEqual(withoutTextIds(b), withoutTextIds(a));
        assert.equal(JSON.stringify(withoutTextIds(b)), JSON.stringify(withoutTextIds(a)), 'same JSON text, same key order');
        assert.equal(JSON.stringify(b.trees), JSON.stringify(a.trees));
    });
}

test('saved key order matches files written by SilverDecisions 1.2.0', () => {
    // fixtures/payofftransform_pass.json was saved by SilverDecisions 1.2.0
    const {file, data} = readFixture('payofftransform_pass.json');
    const saved = JSON.parse(new DataModel(data).serialize());
    assert.deepEqual(Object.keys(saved), Object.keys(file.data));
    assert.deepEqual(Object.keys(saved.trees[0]), Object.keys(file.data.trees[0]));
    assert.deepEqual(Object.keys(saved.trees[0]), ['id', 'computed', 'childEdges', 'name', 'code', 'expressionScope', 'folded', 'location', 'type']);
    assert.deepEqual(Object.keys(saved.trees[0].childEdges[0]), Object.keys(file.data.trees[0].childEdges[0]));
    assert.equal(JSON.stringify(saved.trees), JSON.stringify(file.data.trees), 'trees of this file are written back unchanged');
});

test('legacy files (< 0.7.0): numeric payoffs become [payoff, 0], missing settings get defaults', () => {
    const {data} = readFixture('legacy-0.5.2-variables_pass.json');
    const dm = new DataModel(data);
    const scalar = data.trees[0].childEdges.find(e => !Array.isArray(e.payoff));
    assert.ok(scalar, 'fixture has a numeric payoff');
    assert.deepEqual(dm.edges[0].payoff, [data.trees[0].childEdges[0].payoff, 0]);
    assert.deepEqual([dm.payoffNames, dm.defaultCriterion1Weight, dm.weightLowerBound, dm.weightUpperBound], [[], 1, 0, Infinity]);
    assert.equal(dm.code, data.code);
    assert.deepEqual(dm.expressionScope, data.expressionScope);
});

test('text ids are not restored by load (current behaviour)', (t) => {
    mockRandom(t, 13);
    const {data} = readFixture('fliptest_pass.json');
    const first = JSON.parse(new DataModel(data).serialize());
    assert.equal(first.texts.length, 1);
    assert.match(first.texts[0].id, GUID);
    const second = JSON.parse(new DataModel(first).serialize());
    assert.notEqual(textIds(second)[0], textIds(first)[0]);
    assert.deepEqual(second.texts[0].location, first.texts[0].location);
});

test('serialize: settings, Infinity and the stringify flag', () => {
    const dm = new DataModel();
    dm.addNode(new d.DecisionNode());
    dm.payoffNames = ['a', 'b'];
    dm.weightLowerBound = -Infinity;
    const data = dm.serialize(false);
    // not stringified: live trees and texts, a copy of payoffNames
    assert.equal(data.trees[0], dm.nodes[0]);
    assert.equal(data.texts, dm.texts);
    assert.notEqual(data.payoffNames, dm.payoffNames);
    assert.equal(data.expressionScope, dm.expressionScope);
    const saved = JSON.parse(dm.serialize());
    assert.equal(saved.weightUpperBound, 'Infinity');
    assert.equal(saved.weightLowerBound, '-Infinity');
    // load keeps the string; consumers convert it
    assert.equal(new DataModel(saved).weightUpperBound, 'Infinity');
});

test('serialize filters $-prefixed (transient) fields and parent links', () => {
    const dm = new DataModel();
    const root = dm.addNode(new d.ChanceNode());
    const edge = dm.addNode(new d.TerminalNode(), root);
    const text = new d.Text(new d.Point(1, 1), 'x');
    dm.addText(text);
    root.$hidden = true;
    edge.$linePoints = [[0, 0]];
    text.$displayValue = 'shown';
    root.displayValue('childrenPayoff', '10');
    edge.setSyntaxValidity('probability', false);
    root.$codeError = 'error';
    dm.$codeDirty = true;
    const json = dm.serialize();
    assert.doesNotMatch(json, /"\$/);
    assert.doesNotMatch(json, /"parentNode"/);
    const saved = JSON.parse(json);
    assert.deepEqual(saved.trees[0].computed, {});
    assert.equal(saved.trees[0].childEdges[0].childNode.type, 'terminal');
});

test('serialize options: filterLocation, filterComputed, replacer, filterPrivate', () => {
    const dm = new DataModel();
    const root = dm.addNode(new d.DecisionNode(new d.Point(3, 4)));
    const edge = dm.addNode(new d.TerminalNode(), root);
    edge.computedValue(null, 'payoff[0]', 1);
    dm.addText(new d.Text(new d.Point(1, 1), 'x'));
    edge.payoff = ['1/3', 0];

    const noLocation = JSON.parse(dm.serialize(true, true));
    assert.equal('location' in noLocation.trees[0], false);
    assert.equal('location' in noLocation.texts[0], false);
    assert.ok('computed' in noLocation.trees[0]);
    const noComputed = JSON.parse(dm.serialize(true, false, true));
    assert.equal('computed' in noComputed.trees[0].childEdges[0], false);
    assert.ok('location' in noComputed.trees[0]);

    const seen = [];
    const replaced = JSON.parse(dm.serialize(true, false, false, (k, v) => {
        seen.push(k);
        return k === 'payoff' ? ['replaced'] : v;
    }));
    assert.deepEqual(replaced.trees[0].childEdges[0].payoff, ['replaced']);
    assert.equal(seen.includes('$fieldStatus'), false, 'the replacer runs after the filters');

    edge.setValueValidity('probability', false);
    const withPrivate = JSON.parse(dm.serialize(true, false, false, null, false));
    assert.deepEqual(withPrivate.trees[0].childEdges[0].$fieldStatus, {probability: {valid: {syntax: true, value: false}}});
    assert.equal('parentNode' in withPrivate.trees[0].childEdges[0], false);

    const replacer = dm.getJsonReplacer(true, true, null, true);
    assert.equal(replacer('$x', 1), undefined);
    assert.equal(replacer('parentNode', {}), undefined);
    assert.equal(replacer('location', {}), undefined);
    assert.equal(replacer('computed', {}), undefined);
    assert.equal(replacer('name', 'n'), 'n');
    assert.equal(dm.getJsonReplacer()('location', 1), 1);
    assert.equal(dm.getJsonReplacer(false, false, null, false)('$x', 1), 1);
});

test('load: unknown node types are rejected', () => {
    const dm = new DataModel();
    assert.throws(() => dm.load({trees: [{type: 'unknown', childEdges: []}]}), TypeError);
});

test('load: what is copied from the input data and what is used as it is (current behaviour)', () => {
    const {data} = readFixture('treatments.json');
    const input = JSON.parse(JSON.stringify(data));
    const dm = new DataModel(input);
    const root = dm.getRoots()[0];
    const edge = root.childEdges[0];
    // copied
    assert.notEqual(root.location, input.trees[0].location);
    assert.notEqual(root.computed, input.trees[0].computed);
    assert.notEqual(dm.expressionScope, input.expressionScope);
    // used as they are (callers pass freshly parsed JSON)
    assert.equal(edge.payoff, input.trees[0].childEdges[0].payoff);
    assert.equal(dm.payoffNames, input.payoffNames);
    // loading again replaces the previous trees
    dm.load(JSON.parse(JSON.stringify(data)));
    assert.equal(dm.getRoots().length, 1);
    checkIntegrity(assert, dm);
});

test('getDTO / loadFromDTO keep ids, transient field status, computed values and validation results', () => {
    const {data} = readFixture('rockefellerWithParamsNoRandom.json');
    const dm = new DataModel(data);
    const edge = dm.edges[2];
    edge.setSyntaxValidity('payoff[0]', false);
    dm.nodes[1].displayValue('aggregatedPayoff', '42');
    dm.$codeError = {message: 'e'};
    dm.$codeDirty = true;
    const vr = new ValidationResult();
    vr.addError('incompletePath', dm.nodes[3]);
    dm.validationResults.push(vr);

    // transferred with postMessage (structured clone) between SilverDecisions and the worker
    const dto = structuredClone(dm.getDTO());
    assert.deepEqual(Object.keys(dto), ['serializedData', '$codeError', '$codeDirty', 'validationResults']);
    assert.equal(typeof dto.serializedData, 'string');
    const revived = [];
    const copy = new DataModel();
    copy.loadFromDTO(dto, (k, v) => {
        revived.push(k);
        return v;
    });
    assert.ok(revived.includes('payoff'), 'the reviver is passed to JSON.parse');
    checkIntegrity(assert, copy);
    assert.deepEqual(copy.nodes.map(n => n.id), dm.nodes.map(n => n.id));
    assert.deepEqual(copy.edges.map(e => e.id), dm.edges.map(e => e.id));
    assert.equal(copy.findById(edge.id).isFieldValid('payoff[0]'), false);
    assert.equal(copy.nodes[1].displayValue('aggregatedPayoff'), '42');
    assert.deepEqual(copy.$codeError, {message: 'e'});
    assert.equal(copy.$codeDirty, true);
    assert.equal(copy.validationResults.length, 1);
    assert.ok(copy.validationResults[0] instanceof ValidationResult);
    assert.equal(copy.validationResults[0].isValid(), false);
    assert.deepEqual(copy.validationResults[0].objectIdToError, {[dm.nodes[3].id]: [{name: 'incompletePath'}]});
    // the trees are written without the $parent back references
    assert.doesNotMatch(dto.serializedData, /"\$parent"/);
    assert.deepEqual(withoutTextIds(JSON.parse(copy.serialize())), withoutTextIds(JSON.parse(dm.serialize())));
});

test('updateFrom copies computation results by id', () => {
    const {data} = readFixture('treatments.json');
    const target = new DataModel(data);
    const worker = new DataModel();
    worker.loadFromDTO(structuredClone(target.getDTO()));
    worker.nodes[0].computedValue('rule', 'payoff', 5);
    worker.edges[1].computedValue('rule', 'probability', 0.5);
    worker.expressionScope.x = 1;
    worker.$codeError = 'err';
    worker.$codeDirty = true;
    worker.validationResults = [new ValidationResult()];
    const extra = worker.addNode(new d.TerminalNode(), worker.nodes[0]);
    extra.childNode.computedValue('rule', 'payoff', 1);

    const nodeCount = target.nodes.length;
    target.updateFrom(worker);
    assert.equal(target.nodes.length, nodeCount, 'structure is not changed');
    assert.equal(target.nodes[0].computedValue('rule', 'payoff'), 5);
    assert.notEqual(target.nodes[0].computed, worker.nodes[0].computed, 'computed values are copied');
    assert.equal(target.edges[1].computedValue('rule', 'probability'), 0.5);
    assert.equal(target.expressionScope, worker.expressionScope);
    assert.deepEqual([target.$codeError, target.$codeDirty], ['err', true]);
    assert.equal(target.validationResults, worker.validationResults);

    // a model with a higher $version is not updated
    const newer = new DataModel(data);
    newer.$version = 2;
    newer.updateFrom(worker);
    assert.notEqual(newer.$codeError, 'err');
});
