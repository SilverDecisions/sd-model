// Contract of ValidationResult (filled by the sd-computations tree validator,
// read by sd-tree-designer and SilverDecisions, transferred as a DTO).
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {model} = require('./load');

const {ValidationResult} = model;

test('a new result is valid', () => {
    const v = new ValidationResult();
    assert.equal(v.isValid(), true);
    assert.deepEqual([v.errors, v.warnings, v.objectIdToError], [{}, {}, {}]);
});

test('addError: by name and per object id; string or {name, data}', () => {
    const v = new ValidationResult();
    const a = {id: 'a'};
    const b = {id: 'b'};
    v.addError('incompletePath', a);
    v.addError({name: 'invalidProbability', data: {number: 2}}, a);
    v.addError('incompletePath', b);
    assert.equal(v.isValid(), false);
    assert.deepEqual(Object.keys(v.errors), ['incompletePath', 'invalidProbability']);
    assert.equal(v.errors.incompletePath[0], a);
    assert.equal(v.errors.incompletePath[1], b);
    assert.deepEqual(v.objectIdToError, {
        a: [{name: 'incompletePath'}, {name: 'invalidProbability', data: {number: 2}}],
        b: [{name: 'incompletePath'}]
    });
});

test('warnings do not make the result invalid', () => {
    const v = new ValidationResult();
    const a = {id: 'a'};
    v.addWarning('probabilityDoNotSumUpTo1', a);
    v.addWarning('probabilityDoNotSumUpTo1', a);
    assert.equal(v.isValid(), true);
    assert.deepEqual(v.warnings, {probabilityDoNotSumUpTo1: [a, a]});
});

test('createFromDTO keeps the DTO objects', () => {
    const dto = {errors: {e: [{id: 'x'}]}, warnings: {}, objectIdToError: {x: [{name: 'e'}]}};
    const v = ValidationResult.createFromDTO(JSON.parse(JSON.stringify(dto)));
    assert.ok(v instanceof ValidationResult);
    assert.equal(v.isValid(), false);
    assert.deepEqual({errors: v.errors, warnings: v.warnings, objectIdToError: v.objectIdToError}, dto);
});
