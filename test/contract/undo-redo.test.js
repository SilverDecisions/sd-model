// Contract of the undo / redo state handling: snapshots are deep copies,
// restoring a state relinks nodes and edges by id, stack limits, callbacks,
// revertConf hooks, and _setNewState / createStateSnapshot as used by
// SilverDecisions (tree preview) and the sd-computations job repository.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {model} = require('./load');
const {checkIntegrity, readFixture} = require('./helpers');

const {DataModel, domain: d} = model;

function build() {
    const dm = new DataModel();
    const root = dm.addNode(new d.ChanceNode(new d.Point(1, 2)));
    const e1 = dm.addNode(new d.TerminalNode(), root);
    const e2 = dm.addNode(new d.TerminalNode(), root);
    e1.probability = '0.3';
    e1.payoff = ['10', '1'];
    dm.addText(new d.Text(new d.Point(5, 5), 'note'));
    dm.code = 'a = 1';
    dm.expressionScope.a = 1;
    dm.payoffNames = ['p1', 'p2'];
    return {dm, root, e1, e2};
}

function state(dm) {
    // ids and values of the current state, independent of object identity
    return JSON.parse(dm.serialize());
}

test('createStateSnapshot: deep copy of the model state', () => {
    const {dm, root, e1} = build();
    dm.$codeError = 'err';
    const snapshot = dm.createStateSnapshot('conf');
    assert.deepEqual(Object.keys(snapshot), ['revertConf', 'nodes', 'edges', 'texts', 'payoffNames',
        'defaultCriterion1Weight', 'weightLowerBound', 'weightUpperBound', 'expressionScope', 'code', '$codeError']);
    assert.equal(snapshot.revertConf, 'conf');
    assert.notEqual(snapshot.nodes[0], root);
    assert.equal(snapshot.nodes[0].id, root.id);
    assert.ok(snapshot.nodes[0] instanceof d.ChanceNode, 'class instances are kept');
    assert.notEqual(snapshot.edges[0].payoff, e1.payoff);
    assert.notEqual(snapshot.expressionScope, dm.expressionScope);
    e1.payoff[0] = '99';
    root.location.x = 50;
    assert.equal(snapshot.edges[0].payoff[0], '10');
    assert.equal(snapshot.nodes[0].location.x, 1);
    assert.equal(snapshot.$codeError, 'err');
});

test('saveState / undo / redo restore the saved states', () => {
    const {dm, root, e1} = build();
    const before = state(dm);
    assert.equal(dm.isUndoAvailable(), false);
    dm.saveState();
    assert.equal(dm.isUndoAvailable(), true);
    assert.equal(dm.isRedoAvailable(), false);

    dm.removeNode(e1.childNode);
    e1.payoff[0] = 'changed';
    root.name = 'renamed';
    dm.code = 'b = 2';
    dm.payoffNames.push('p3');
    const after = state(dm);

    assert.equal(dm.undo(), dm);
    assert.deepEqual(state(dm), before);
    assert.equal(dm.isRedoAvailable(), true);
    assert.equal(dm.isUndoAvailable(), false);
    checkIntegrity(assert, dm);
    assert.ok(dm.nodes.every(n => n instanceof d.Node));
    assert.ok(dm.edges.every(e => e instanceof d.Edge));
    assert.ok(dm.texts[0] instanceof d.Text);
    // restored objects are copies: ids stay, identity changes
    assert.notEqual(dm.nodes[0], root);
    assert.equal(dm.findById(root.id).name, '');

    assert.equal(dm.redo(), dm);
    assert.deepEqual(state(dm), after);
    checkIntegrity(assert, dm);
    // redo restores the live objects of the undone state
    assert.equal(dm.nodes[0], root);
    // nothing to undo / redo: returns undefined, state unchanged
    dm.undo();
    const s = state(dm);
    assert.equal(dm.undo(), undefined);
    assert.deepEqual(state(dm), s);
    dm.redo();
    assert.equal(dm.redo(), undefined);
    assert.deepEqual(state(dm), after);
});

test('restored state relinks a fixture tree consistently', () => {
    const dm = new DataModel(readFixture('fliptest_pass.json').data);
    const before = state(dm);
    dm.saveState();
    dm.removeNodes(dm.getRoots());
    assert.equal(dm.nodes.length, 0);
    dm.undo();
    checkIntegrity(assert, dm);
    assert.deepEqual(state(dm), before);
    assert.equal(dm.getRoots().length, 2);
});

test('a new saveState clears redo; the undo stack keeps maxStackSize (20) states', () => {
    const dm = new DataModel();
    assert.equal(dm.maxStackSize, 20);
    dm.saveState();
    dm.code = 'x';
    dm.undo();
    assert.equal(dm.isRedoAvailable(), true);
    dm.saveState();
    assert.equal(dm.isRedoAvailable(), false);

    dm.undoStack.length = 0;
    for (let i = 0; i < 25; i++) {
        dm.code = 'v' + i;
        dm.saveState();
    }
    assert.equal(dm.undoStack.length, 20);
    assert.deepEqual([dm.undoStack[0].code, dm.undoStack[19].code], ['v5', 'v24']);
});

test('undoRedoStateChangedCallback and revertConf hooks', () => {
    const dm = new DataModel();
    let changes = 0;
    const hooks = [];
    dm.undoRedoStateChangedCallback = () => changes++;
    const conf = {data: {x: 1}, onUndo: data => hooks.push(['undo', data]), onRedo: data => hooks.push(['redo', data])};
    dm.saveState(conf);
    dm.undo();
    dm.redo();
    assert.equal(changes, 3);
    assert.deepEqual(hooks, [['undo', {x: 1}], ['redo', {x: 1}]]);
    assert.equal(dm.revertConf, conf);
    dm.callbacksDisabled = true;
    dm.saveState();
    assert.equal(changes, 3);
});

test('saveStateFromSnapshot: a snapshot taken before an edit becomes the undo state', () => {
    const {dm, root} = build();
    const snapshot = dm.createStateSnapshot();
    root.moveTo(100, 100);
    dm.saveStateFromSnapshot(snapshot);
    dm.undo();
    assert.deepEqual([dm.getRoots()[0].location.x, dm.getRoots()[0].location.y], [1, 2]);
});

test('_setNewState(createStateSnapshot()) copies a model (sd-computations job repository, tree preview)', () => {
    const source = new DataModel(readFixture('payofftransform_pass.json').data);
    const copy = new DataModel();
    copy._setNewState(source.createStateSnapshot());
    checkIntegrity(assert, copy);
    assert.deepEqual(state(copy), state(source));
    assert.notEqual(copy.nodes[0], source.nodes[0]);
    copy.nodes[0].name = 'changed';
    copy.edges[0].payoff[0] = 'changed';
    assert.notEqual(source.nodes[0].name, 'changed');
    assert.notEqual(source.edges[0].payoff[0], 'changed');
    // restoring the original state of the same model (SilverDecisions tree preview)
    const before = state(source);
    const original = source.createStateSnapshot();
    source.removeNodes(source.getRoots());
    source.code = 'changed';
    source._setNewState(original);
    assert.deepEqual(state(source), before);
    checkIntegrity(assert, source);
});
