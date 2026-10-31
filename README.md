# sd-model
SilverDecisions data model module


[![Build Status](https://travis-ci.org/SilverDecisions/sd-model.svg?branch=master)](https://travis-ci.org/SilverDecisions/sd-model)
[![codecov](https://codecov.io/gh/SilverDecisions/sd-model/branch/master/graph/badge.svg)](https://codecov.io/gh/SilverDecisions/sd-model)

## Contract tests

`npm test` runs the node:test contract tests in `test/contract/` (Node 22 or
later) against `dist/standalone/sd-model.js`. `SD_MODEL_TARGET` selects another
variant:

| Target | Tested code |
|---|---|
| `standalone`, `standalone.min` | `dist/standalone/sd-model(.min).js` (UMD, sd-utils bundled) |
| `module`, `module.min` | `dist/sd-model(.min).js`, loaded after `dist/sd-utils.js` of the installed sd-utils (global `require`) |
| `source` | `index.js` bundled with browserify and the package's `browserify.transform`, as SilverDecisions does |
| a file path | a CommonJS file exporting the package exports |

`SD_MODEL_DIST` points at another `dist/` directory, `SD_UTILS_BUNDLE` at
another sd-utils `require` bundle.

The tests cover the API used by sd-computations, sd-tree-designer and
SilverDecisions: exports and bundle globals, domain classes, editing trees,
ids and parent-child links, undo / redo, validation results, the DTO and
loading / saving of the diagram files in `test/contract/fixtures/` (saved by
SilverDecisions 0.5.2 to 1.2.0). Saved data is compared semantically with an
expectation derived from the file format, and load -> save -> load -> save
must give the same data after the first save. Randomness (ids) is mocked per
test with a seeded generator.

The Jasmine spec `test/specs/model.spec.js` runs with Karma (`gulp test`).
