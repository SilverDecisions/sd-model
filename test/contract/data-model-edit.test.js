// Contract of DataModel editing operations used by sd-tree-designer,
// sd-computations and SilverDecisions: building trees, ids, parent-child links,
// subtree operations, lookups, callbacks.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {model} = require('./load');
const {checkIntegrity, readFixture} = require('./helpers');

const {DataModel, domain: d} = model;

// root (decision) -> chance -> [terminal, terminal], root -> terminal
function sampleTree() {
    const dm = new DataModel();
    const root = dm.addNode(new d.DecisionNode(new d.Point(0, 0)));
    const toChance = dm.addNode(new d.ChanceNode(new d.Point(100, 0)), root);
    const toT1 = dm.addNode(new d.TerminalNode(new d.Point(200, -50)), toChance.childNode);
    const toT2 = dm.addNode(new d.TerminalNode(new d.Point(200, 50)), toChance.childNode);
    const toT3 = dm.addNode(new d.TerminalNode(new d.Point(100, 100)), root);
    return {dm, root, chance: toChance.childNode, toChance, toT1, toT2, toT3};
}

test('addNode: returns the node for a root and the new edge for a child', () => {
    const {dm, root, chance, toChance, toT1, toT3} = sampleTree();
    assert.ok(root instanceof d.DecisionNode);
    assert.ok(toChance instanceof d.Edge);
    assert.equal(toChance.parentNode, root);
    assert.equal(chance.$parent, root);
    assert.equal(root.$parent, undefined);
    assert.deepEqual(root.childEdges, [toChance, toT3]);
    assert.equal(dm.nodes.length, 5);
    assert.equal(dm.edges.length, 4);
    assert.deepEqual(dm.getRoots(), [root]);
    // initial probability: '#' (rest) below a chance node, undefined otherwise
    assert.equal(toChance.probability, undefined);
    assert.equal(toT1.probability, '#');
    assert.deepEqual(toT1.payoff, [0, 0]);
    checkIntegrity(assert, dm);
});

test('ids and lookups: findById, findNodeById, findEdgeById', () => {
    const {dm, chance, toT1} = sampleTree();
    assert.equal(dm.findById(chance.id), chance);
    assert.equal(dm.findById(toT1.id), toT1);
    assert.equal(dm.findNodeById(chance.id), chance);
    assert.equal(dm.findNodeById(toT1.id), undefined);
    assert.equal(dm.findEdgeById(toT1.id), toT1);
    assert.equal(dm.findById('missing'), undefined);
});

test('descendants and subtree roots', () => {
    const {dm, root, chance, toChance, toT1, toT2, toT3} = sampleTree();
    assert.deepEqual(dm.getAllDescendantNodes(root), [chance, toT1.childNode, toT2.childNode, toT3.childNode]);
    assert.deepEqual(dm.getAllDescendantEdges(root), [toChance, toT1, toT2, toT3]);
    assert.deepEqual(dm.getAllNodesInSubtree(chance), [chance, toT1.childNode, toT2.childNode]);
    assert.deepEqual(dm.findSubtreeRoots([toT1.childNode, chance, toT3.childNode]), [chance, toT3.childNode]);
    assert.deepEqual(dm.findSubtreeRoots([root, chance]), [root]);
});

test('injectNode: inserts a node into an edge', () => {
    const {dm, root, chance, toChance} = sampleTree();
    const injected = new d.DecisionNode();
    dm.injectNode(injected, toChance);
    assert.equal(toChance.childNode, injected);
    assert.equal(injected.$parent, root);
    assert.equal(injected.childEdges.length, 1);
    assert.equal(injected.childEdges[0].childNode, chance);
    assert.equal(chance.$parent, injected);
    assert.equal(dm.nodes.length, 6);
    assert.equal(dm.edges.length, 5);
    checkIntegrity(assert, dm);
});

test('removeNode / removeNodes: remove the subtree and the edge from the parent', () => {
    const {dm, root, chance, toChance, toT1, toT3} = sampleTree();
    dm.removeNode(chance);
    assert.deepEqual(root.childEdges, [toT3]);
    assert.equal(dm.nodes.length, 2);
    assert.equal(dm.edges.length, 1);
    assert.equal(dm.findById(toT1.id), undefined);
    assert.equal(dm.findById(toChance.id), undefined);
    checkIntegrity(assert, dm);

    const s = sampleTree();
    // a node and its own descendant: removed once, as a subtree
    s.dm.removeNodes([s.toT1.childNode, s.chance, s.toT3.childNode]);
    assert.deepEqual(s.dm.nodes, [s.root]);
    assert.deepEqual(s.dm.edges, []);
    checkIntegrity(assert, s.dm);
    s.dm.removeNodes([s.root]);
    assert.deepEqual([s.dm.nodes.length, s.dm.getRoots().length], [0, 0]);
});

test('convertNode: allowed conversions, the new node takes the place and the edges', () => {
    const {dm, root, chance, toChance, toT1} = sampleTree();
    toT1.probability = '0.3';
    // chance node with children -> decision: children kept, probabilities reset
    dm.convertNode(chance, 'decision');
    const converted = toChance.childNode;
    assert.ok(converted instanceof d.DecisionNode);
    assert.notEqual(converted, chance);
    assert.equal(converted.$parent, root);
    assert.equal(converted.childEdges[0], toT1);
    assert.equal(toT1.parentNode, converted);
    assert.equal(toT1.probability, undefined);
    assert.equal(dm.nodes.includes(chance), false);
    assert.equal(dm.nodes.includes(converted), true);
    assert.equal(dm.nodes.length, 5);
    // decision with children -> chance: probabilities become '#'
    dm.convertNode(converted, 'chance');
    const back = toChance.childNode;
    assert.ok(back instanceof d.ChanceNode);
    assert.equal(back.childEdges[0].probability, '#');
    // a node with children cannot become a terminal node
    dm.convertNode(back, 'terminal');
    assert.equal(toChance.childNode, back);
    // a leaf with a parent can become any type
    dm.convertNode(toT1.childNode, 'chance');
    assert.ok(toT1.childNode instanceof d.ChanceNode);
});

test('cloneSubtree: detached copy with new ids, attachSubtree registers it', () => {
    const {dm, root, chance, toT1} = sampleTree();
    toT1.payoff = ['5', '1'];
    toT1.probability = '0.4';
    chance.name = 'c';
    chance.computedValue('r', 'payoff', 3);
    toT1.computedValue('r', 'probability', 0.4);
    const clone = dm.cloneSubtree(chance, true);
    assert.equal(clone.$parent, null);
    assert.equal(dm.nodes.includes(clone), false);
    assert.equal(clone.name, 'c');
    assert.notEqual(clone.id, chance.id);
    assert.notEqual(clone.location, chance.location);
    assert.deepEqual([clone.location.x, clone.location.y], [chance.location.x, chance.location.y]);
    assert.equal(clone.childEdges.length, 2);
    const e = clone.childEdges[0];
    assert.notEqual(e.id, toT1.id);
    assert.equal(e.parentNode, clone);
    assert.equal(e.childNode.$parent, clone);
    assert.deepEqual(e.payoff, ['5', '1']);
    assert.notEqual(e.payoff, toT1.payoff);
    assert.equal(e.probability, '0.4');
    assert.deepEqual(clone.computed, {r: {payoff: 3}});
    assert.deepEqual(e.computed, {r: {probability: 0.4}});
    // without computed values, edges get empty computed values
    assert.deepEqual(dm.cloneSubtree(chance).childEdges[0].computed, {});

    const nodesBefore = dm.nodes.length;
    const edge = dm.attachSubtree(clone, root);
    assert.ok(edge instanceof d.Edge);
    assert.equal(edge.childNode, clone);
    assert.equal(dm.nodes.length, nodesBefore + 3);
    assert.equal(clone.expressionScope, null);
    checkIntegrity(assert, dm);
    // attaching without a parent gives a new root
    const other = dm.cloneSubtree(root);
    assert.equal(dm.attachSubtree(other), other);
    assert.equal(dm.getRoots().length, 2);
    checkIntegrity(assert, dm);
});

test('callbacks: node and text added / removed, callbacksDisabled', () => {
    const dm = new DataModel();
    const calls = [];
    dm.nodeAddedCallback = n => calls.push(['nodeAdded', n]);
    dm.nodeRemovedCallback = n => calls.push(['nodeRemoved', n]);
    dm.textAddedCallback = t => calls.push(['textAdded', t]);
    dm.textRemovedCallback = t => calls.push(['textRemoved', t]);
    const root = dm.addNode(new d.DecisionNode());
    const child = dm.addNode(new d.TerminalNode(), root).childNode;
    const text = new d.Text(new d.Point(1, 1), 'x');
    dm.addText(text);
    assert.deepEqual(dm.texts, [text]);
    dm.removeTexts([text]);
    dm.removeText(text);
    dm.removeNode(root);
    assert.deepEqual(calls.map(c => c[0]), ['nodeAdded', 'nodeAdded', 'textAdded', 'textRemoved', 'nodeRemoved', 'nodeRemoved']);
    assert.deepEqual(calls.map(c => c[1]), [root, child, text, text, child, root]);

    calls.length = 0;
    dm.callbacksDisabled = true;
    dm.addNode(new d.DecisionNode());
    dm.addText(new d.Text());
    assert.deepEqual(calls, []);
    // load() disables callbacks while loading and restores the flag
    dm.callbacksDisabled = false;
    dm.load(readFixture('treatments.json').data);
    assert.deepEqual(calls, []);
    assert.equal(dm.callbacksDisabled, false);
});

test('clear, clearComputedValues, clearExpressionScope, reversePayoffs, getGlobalVariableNames', () => {
    const {dm, toT1, chance} = sampleTree();
    toT1.payoff = [1, 2];
    dm.payoffNames = ['cost', 'effect'];
    chance.computedValue('r', 'x', 1);
    toT1.computedValue('r', 'x', 1);
    dm.clearComputedValues();
    assert.deepEqual([chance.computed, toT1.computed], [{}, {}]);

    dm.reversePayoffs();
    assert.deepEqual(toT1.payoff, [2, 1]);
    assert.deepEqual(dm.payoffNames, ['effect', 'cost']);

    const scope = dm.expressionScope;
    Object.assign(scope, {a: 1, f: () => 1, b: 'x'});
    assert.deepEqual(dm.getGlobalVariableNames(), ['a', 'b']);
    assert.deepEqual(dm.getGlobalVariableNames(false), ['a', 'f', 'b']);
    dm.clearExpressionScope();
    assert.equal(dm.expressionScope, scope, 'cleared in place');
    assert.deepEqual(scope, {});

    dm.code = 'a=1';
    dm.$codeError = 'e';
    dm.$codeDirty = true;
    dm.saveState();
    dm.weightUpperBound = 5;
    dm.clear();
    assert.deepEqual([dm.nodes, dm.edges, dm.texts, dm.undoStack, dm.redoStack, dm.payoffNames], [[], [], [], [], [], []]);
    assert.deepEqual([dm.code, dm.$codeError, dm.$codeDirty, dm.defaultCriterion1Weight, dm.weightLowerBound, dm.weightUpperBound],
        ['', null, false, 1, 0, Infinity]);
});

// Regression: replaceNode (used by convertNode) did not update $parent of the
// children, which kept pointing to the removed node. sd-computations then took
// the expression scope of the children from the removed node (stale variable
// values) and sd-tree-designer treated the children of a selected converted
// node as separate subtrees (copy / paste duplicated them).
test('convertNode: the children of the new node have it as $parent', () => {
    const {dm, root, chance, toChance, toT1, toT2} = sampleTree();
    dm.convertNode(chance, 'decision');
    const converted = toChance.childNode;
    assert.equal(toT1.childNode.$parent, converted);
    assert.equal(toT2.childNode.$parent, converted);
    checkIntegrity(assert, dm);
    const subtree = dm.getAllNodesInSubtree(converted);
    assert.deepEqual(dm.findSubtreeRoots(subtree), [converted]);
    // a converted leaf keeps the parent chain
    dm.convertNode(toT1.childNode, 'chance');
    assert.equal(toT1.childNode.$parent, converted);
    checkIntegrity(assert, dm);
    // and the relinked state survives undo / redo
    dm.saveState();
    dm.removeNodes([converted]);
    dm.undo();
    checkIntegrity(assert, dm);
    assert.equal(dm.getRoots().length, 1);
    assert.equal(dm.getRoots()[0].id, root.id);
});

// Regression: cloneSubtree shared the field status objects of the nodes and
// edges (and the nested computed values of the nodes) with the original, so
// marking a field of the pasted copy as invalid marked the original too, and
// sd-computations skipped evaluating the original's expressions.
test('cloneSubtree: the copy does not share field status or computed values with the original', () => {
    const {dm, chance, toT1} = sampleTree();
    chance.computedValue('rule', 'payoff', 1);
    chance.setValueValidity('name', true);
    toT1.setValueValidity('probability', true);
    for (const cloneComputed of [false, true]) {
        const copy = dm.cloneSubtree(chance, cloneComputed);
        const copiedEdge = copy.childEdges[0];
        copiedEdge.setSyntaxValidity('probability', false);
        copy.setSyntaxValidity('name', false);
        copy.computedValue('rule', 'payoff', 2);
        assert.equal(toT1.isFieldValid('probability'), true);
        assert.equal(chance.isFieldValid('name'), true);
        assert.equal(chance.computedValue('rule', 'payoff'), 1);
        // the copy keeps the state it was copied with
        assert.equal(dm.cloneSubtree(copy).childEdges[0].isFieldValid('probability'), false);
        assert.equal(dm.cloneSubtree(copy).computedValue('rule', 'payoff'), 2);
    }
});
