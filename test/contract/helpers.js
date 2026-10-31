// Shared helpers of the contract tests. The expectations are written from the
// file format and the documented behaviour of DataModel.load / serialize, not
// from the output of a build.
'use strict';

const fs = require('fs');
const path = require('path');

const FIXTURES = path.join(__dirname, 'fixtures');

// Saved SilverDecisions files (see fixtures/README.md) and the `data` object
// App.openDiagram passes to DataModel.load (files older than 0.7.0 keep the
// model at the top level).
function readFixture(name) {
    const file = JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));
    const data = file.data || {code: file.code, expressionScope: file.expressionScope, trees: file.trees, texts: file.texts};
    return {file, data};
}

const FIXTURE_NAMES = fs.readdirSync(FIXTURES).filter(f => f.endsWith('.json')).sort();

// Deterministic Math.random for one test (restored by node:test after the test).
function mockRandom(t, seed = 1) {
    let a = seed >>> 0;
    t.mock.method(Math, 'random', () => {
        // mulberry32
        a = (a + 0x6D2B79F5) >>> 0;
        let x = a;
        x = Math.imul(x ^ (x >>> 15), x | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    });
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Structural invariants of a DataModel: every edge belongs to exactly one
// parent's childEdges, parentNode / childNode / $parent agree, all nodes of a
// subtree are registered, roots are the nodes without $parent.
function checkIntegrity(assert, dataModel) {
    const nodes = new Set(dataModel.nodes);
    const edges = new Set(dataModel.edges);
    assert.equal(nodes.size, dataModel.nodes.length, 'no duplicate nodes');
    assert.equal(edges.size, dataModel.edges.length, 'no duplicate edges');
    const seenEdges = new Set();
    for (const node of dataModel.nodes) {
        for (const edge of node.childEdges) {
            assert.ok(edges.has(edge), 'child edge registered in edges');
            assert.ok(!seenEdges.has(edge), 'edge has one parent');
            seenEdges.add(edge);
            assert.equal(edge.parentNode, node, 'edge.parentNode');
            assert.ok(nodes.has(edge.childNode), 'edge.childNode registered in nodes');
            assert.equal(edge.childNode.$parent, node, 'childNode.$parent');
        }
        if (node.$parent) {
            assert.ok(nodes.has(node.$parent), '$parent registered');
            assert.equal(node.$parent.childEdges.filter(e => e.childNode === node).length, 1, 'one edge from $parent');
        }
    }
    assert.equal(seenEdges.size, edges.size, 'every edge is a child edge of a registered node');
    assert.deepEqual(dataModel.getRoots(), dataModel.nodes.filter(n => !n.$parent));
    const ids = dataModel.nodes.map(n => n.id).concat(dataModel.edges.map(e => e.id));
    assert.equal(new Set(ids).size, ids.length, 'unique node and edge ids');
}

function countSubtree(node) {
    let nodes = 1;
    let edges = 0;
    for (const edge of node.childEdges || []) {
        const c = countSubtree(edge.childNode);
        nodes += c.nodes;
        edges += c.edges + 1;
    }
    return {nodes, edges};
}

function stripIds(value) {
    if (Array.isArray(value)) {
        return value.map(stripIds);
    }
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) {
            if (k !== 'id') {
                out[k] = stripIds(value[k]);
            }
        }
        return out;
    }
    return value;
}

// Expected result of serialize() after load(data), derived from the file
// format: which fields DataModel.load restores, with which defaults, and how
// JSON.stringify writes them (Utils.stringify writes +-Infinity as strings).
//   node: id (kept if present), computed, childEdges, name, code (default ''),
//         expressionScope (default null), folded (boolean), location (x, y; default 0, 0), type
//   edge: id (kept if present), computed, name, probability, payoff (a number becomes [payoff, 0]), childNode
//   text: value, location (the saved id is not restored, see the tests)
// Missing values (undefined) are not written.
function expectedNode(n) {
    const out = {};
    if (n.id) {
        out.id = n.id;
    }
    out.computed = n.computed || {};
    out.childEdges = (n.childEdges || []).map(expectedEdge);
    out.name = n.name;
    out.code = n.code || '';
    out.expressionScope = n.expressionScope || null;
    out.folded = !!n.folded;
    out.location = n.location ? {x: n.location.x, y: n.location.y} : {x: 0, y: 0};
    out.type = n.type;
    return dropUndefined(out);
}

function expectedEdge(e) {
    const out = {};
    if (e.id) {
        out.id = e.id;
    }
    out.computed = e.computed || {};
    out.name = e.name;
    out.probability = e.probability;
    out.payoff = Array.isArray(e.payoff) ? e.payoff : [e.payoff, 0];
    out.childNode = expectedNode(e.childNode);
    return dropUndefined(out);
}

function expectedData(data) {
    const has = v => v !== undefined && v !== null;
    return {
        code: data.code || '',
        expressionScope: data.expressionScope || {},
        trees: data.trees.map(expectedNode),
        texts: (data.texts || []).map(t => ({value: t.value, location: {x: t.location.x, y: t.location.y}})),
        payoffNames: has(data.payoffNames) ? data.payoffNames : [],
        defaultCriterion1Weight: has(data.defaultCriterion1Weight) ? data.defaultCriterion1Weight : 1,
        weightLowerBound: has(data.weightLowerBound) ? data.weightLowerBound : 0,
        weightUpperBound: has(data.weightUpperBound) ? data.weightUpperBound : 'Infinity'
    };
}

function dropUndefined(o) {
    for (const k of Object.keys(o)) {
        if (o[k] === undefined) {
            delete o[k];
        }
    }
    return o;
}

// The serialized data without ids that load() generates (fixtures without ids)
// and without text ids (not restored by load()).
function withoutGeneratedIds(saved, data) {
    const copy = JSON.parse(JSON.stringify(saved));
    copy.texts = copy.texts.map(t => {
        const rest = Object.assign({}, t);
        delete rest.id;
        return rest;
    });
    copy.trees = copy.trees.map((tree, i) => stripMissingIds(tree, data.trees[i]));
    return copy;
}

function stripMissingIds(saved, original) {
    const out = Object.assign({}, saved);
    if (!original.id) {
        delete out.id;
    }
    out.childEdges = saved.childEdges.map((e, i) => {
        const oe = original.childEdges[i];
        const edge = Object.assign({}, e);
        if (!oe.id) {
            delete edge.id;
        }
        edge.childNode = stripMissingIds(e.childNode, oe.childNode);
        return edge;
    });
    return out;
}

module.exports = {
    readFixture, FIXTURE_NAMES, mockRandom, GUID, checkIntegrity, countSubtree, stripIds,
    expectedData, withoutGeneratedIds
};
