// Contract of the domain classes (src/domain): constructors, defaults, class
// field semantics, computed / display values, field validity status.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {model} = require('./load');
const {mockRandom, GUID} = require('./helpers');

const d = model.domain;

test('node types and $TYPE', () => {
    assert.equal(d.DecisionNode.$TYPE, 'decision');
    assert.equal(d.ChanceNode.$TYPE, 'chance');
    assert.equal(d.TerminalNode.$TYPE, 'terminal');
    assert.equal(new d.DecisionNode().type, 'decision');
    assert.equal(new d.ChanceNode().type, 'chance');
    assert.equal(new d.TerminalNode().type, 'terminal');
    assert.equal(new d.Node('custom').type, 'custom');
});

test('node defaults', () => {
    const n = new d.ChanceNode();
    assert.deepEqual({x: n.location.x, y: n.location.y}, {x: 0, y: 0});
    assert.ok(n.location instanceof d.Point);
    assert.deepEqual(n.childEdges, []);
    assert.equal(n.name, '');
    assert.equal(n.code, '');
    assert.equal(n.$codeDirty, false);
    assert.equal(n.$codeError, null);
    assert.equal(n.expressionScope, null);
    assert.equal(n.folded, false);
    assert.deepEqual(n.computed, {});
    assert.deepEqual(n.$fieldStatus, {});
    assert.deepEqual(n.$DISPLAY_VALUE_NAMES, ['childrenPayoff', 'aggregatedPayoff', 'probabilityToEnter', 'optimal']);
    const location = new d.Point(3, 4);
    assert.equal(new d.TerminalNode(location).location, location, 'the given location is used, not copied');
    // per-instance field values
    assert.notEqual(new d.DecisionNode().childEdges, n.childEdges);
});

// Class fields are compiled as assignments (transform-class-properties, Babel 6
// semantics): fields without an initializer (`type;`, `location;`) do not create
// a property, the constructor assigns them after the initializers. This gives
// the key order of saved files (see serialization.test.js).
test('class fields: own property order of new objects', () => {
    assert.deepEqual(Object.keys(new d.DecisionNode()), ['id', '$fieldStatus', '$ObjectWithIdAndEditableFields',
        'computed', 'childEdges', 'name', 'code', '$codeDirty', '$codeError', 'expressionScope', 'folded',
        '$DISPLAY_VALUE_NAMES', 'location', 'type']);
    assert.deepEqual(Object.keys(new d.Edge()), ['id', '$fieldStatus', '$ObjectWithIdAndEditableFields', 'computed',
        'name', 'probability', 'payoff', '$DISPLAY_VALUE_NAMES', 'parentNode', 'childNode']);
    assert.deepEqual(Object.keys(new d.Text()), ['id', '$fieldStatus', '$ObjectWithIdAndEditableFields', 'value', 'location']);
    assert.deepEqual(Object.keys(new d.Point()), ['x', 'y']);
    assert.deepEqual(Object.keys(new model.DataModel()), ['nodes', 'edges', 'texts', 'payoffNames',
        'defaultCriterion1Weight', 'weightLowerBound', 'weightUpperBound', 'expressionScope', 'code', '$codeError',
        '$codeDirty', '$version', 'validationResults', 'maxStackSize', 'undoStack', 'redoStack',
        'undoRedoStateChangedCallback', 'nodeAddedCallback', 'nodeRemovedCallback', 'textAddedCallback',
        'textRemovedCallback', 'callbacksDisabled']);
    assert.deepEqual(Object.keys(new model.ValidationResult()), ['errors', 'warnings', 'objectIdToError']);
});

test('ids: Utils.guid() per object', (t) => {
    mockRandom(t, 7);
    const a = new d.DecisionNode();
    const b = new d.Edge();
    const c = new d.Text();
    for (const o of [a, b, c]) {
        assert.match(o.id, GUID);
    }
    assert.equal(new Set([a.id, b.id, c.id]).size, 3);
    // the id is an ordinary writable field (restored by DataModel.load)
    a.id = 'n1';
    assert.equal(a.id, 'n1');
});

test('Point: (x, y), Point and [x, y] arguments; move / moveTo', () => {
    const p = new d.Point(1, 2);
    assert.deepEqual([p.x, p.y], [1, 2]);
    const q = new d.Point(p);
    assert.deepEqual([q.x, q.y], [1, 2]);
    assert.notEqual(q, p);
    const r = new d.Point([5, 6]);
    assert.deepEqual([r.x, r.y], [5, 6]);
    assert.equal(r.moveTo(7, 8), r);
    assert.deepEqual([r.x, r.y], [7, 8]);
    r.moveTo([1, 1]);
    assert.deepEqual([r.x, r.y], [1, 1]);
    assert.equal(r.move(2, 3), r);
    assert.deepEqual([r.x, r.y], [3, 4]);
    r.move([-3, -4]);
    assert.deepEqual([r.x, r.y], [0, 0]);
});

test('Text: location and value', () => {
    const t = new d.Text(new d.Point(10, 20), 'note');
    assert.equal(t.value, 'note');
    assert.equal(t.moveTo(1, 2), t);
    assert.deepEqual([t.location.x, t.location.y], [1, 2]);
    t.move(1, 1);
    assert.deepEqual([t.location.x, t.location.y], [2, 3]);
    const empty = new d.Text();
    assert.equal(empty.value, '');
    assert.deepEqual([empty.location.x, empty.location.y], [0, 0]);
});

test('Node.move / moveTo, optionally with the subtree', () => {
    const root = new d.DecisionNode(new d.Point(0, 0));
    const child = new d.TerminalNode(new d.Point(10, 10));
    const edge = new d.Edge(root, child);
    root.childEdges.push(edge);
    assert.equal(root.moveTo(5, 5), root);
    assert.deepEqual([child.location.x, child.location.y], [10, 10]);
    root.moveTo(10, 15, true);
    assert.deepEqual([root.location.x, root.location.y], [10, 15]);
    assert.deepEqual([child.location.x, child.location.y], [15, 20]);
    root.move(1, 2, true);
    assert.deepEqual([child.location.x, child.location.y], [16, 22]);
    root.move(1, 1);
    assert.deepEqual([child.location.x, child.location.y], [16, 22]);
    assert.equal(root.setName('r'), root);
    assert.equal(root.name, 'r');
});

test('Edge: constructor arguments, defaults and setters', () => {
    const p = new d.ChanceNode();
    const c = new d.TerminalNode();
    const e = new d.Edge(p, c);
    assert.equal(e.parentNode, p);
    assert.equal(e.childNode, c);
    assert.equal(e.name, '');
    assert.equal(e.probability, undefined);
    assert.deepEqual(e.payoff, [0, 0]);
    assert.deepEqual(e.$DISPLAY_VALUE_NAMES, ['probability', 'payoff', 'optimal']);
    const payoff = [1, 2];
    const f = new d.Edge(p, c, 'yes', payoff, '0.5');
    assert.equal(f.name, 'yes');
    assert.equal(f.payoff, payoff);
    assert.equal(f.probability, '0.5');
    assert.equal(e.setName('n').setProbability('#').setPayoff('10').setPayoff('-3', 1), e);
    assert.deepEqual([e.name, e.probability, e.payoff], ['n', '#', ['10', '-3']]);
});

test('computed values: computedValue(rule, path, value), display values, clearing', () => {
    const e = new d.Edge(new d.ChanceNode(), new d.TerminalNode());
    assert.equal(e.computedValue('rule-a', 'payoff', undefined), null);
    assert.equal(e.computedValue('rule-a', 'payoff', 5), 5);
    assert.equal(e.computedValue('rule-a', 'payoff'), 5);
    assert.deepEqual(e.computed, {'rule-a': {payoff: 5}});
    assert.equal(e.computedBaseProbability(0.25), 0.25);
    assert.equal(e.computedBaseProbability(), 0.25);
    assert.equal(e.computedBasePayoff(7), 7);
    assert.equal(e.computedBasePayoff(8, 1), 8);
    assert.deepEqual(e.computed.payoff, [7, 8]);
    assert.equal(e.computedBasePayoff(undefined, 1), 8);
    assert.equal(e.displayProbability('25%'), '25%');
    assert.equal(e.displayPayoff('$7', 0), '$7');
    assert.equal(e.displayValue('payoff[0]'), '$7');
    assert.deepEqual(e.computed.$displayValues, {probability: '25%', payoff: ['$7']});

    e.computedValue('rule-b', 'x', 1);
    e.clearComputedValues('rule-a');
    assert.deepEqual(e.computed['rule-a'], {});
    e.clearComputedValues(['rule-b']);
    assert.deepEqual(e.computed['rule-b'], {});
    e.clearDisplayValues();
    assert.deepEqual(e.computed.$displayValues, {});
    e.clearComputedValues();
    assert.deepEqual(e.computed, {});

    const source = {r: {payoff: [1]}};
    e.loadComputedValues(source);
    assert.deepEqual(e.computed, source);
    assert.notEqual(e.computed.r, source.r, 'loadComputedValues copies deeply');
});

test('field status: syntax and value validity per field path', () => {
    const e = new d.Edge();
    assert.deepEqual(e.getFieldStatus('probability'), {valid: {syntax: true, value: true}});
    assert.equal(e.isFieldValid('probability'), true);
    e.setSyntaxValidity('payoff[1]', false);
    assert.equal(e.isFieldValid('payoff[1]'), false);
    assert.equal(e.isFieldValid('payoff[1]', true, false), false);
    assert.equal(e.isFieldValid('payoff[1]', false, true), true);
    assert.equal(e.isFieldValid('payoff[0]'), true);
    e.setSyntaxValidity('payoff[1]', true);
    e.setValueValidity('payoff[1]', false);
    assert.equal(e.isFieldValid('payoff[1]'), false);
    assert.equal(e.isFieldValid('payoff[1]', true, false), true);
    assert.equal(e.isFieldValid('payoff[1]', false, true), false);
    assert.deepEqual(e.$fieldStatus, {
        probability: {valid: {syntax: true, value: true}},
        payoff: [{valid: {syntax: true, value: true}}, {valid: {syntax: true, value: false}}]
    });
});
