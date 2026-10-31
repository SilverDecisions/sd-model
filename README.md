# sd-model
SilverDecisions data model module

## Usage

The package entry point is the source: `index.js` exports `DataModel`,
`ValidationResult` and `domain` (`Node`, `DecisionNode`, `ChanceNode`,
`TerminalNode`, `Edge`, `Point`, `Text`). Consumers (sd-computations,
sd-tree-designer, SilverDecisions) bundle it with browserify; the
`browserify.transform` field compiles `index.js` and `src/` with Babel to ES5
(class fields as assignments).

```js
import {DataModel, domain, ValidationResult} from 'sd-model';
```

Prebuilt bundles in `dist/`:

| File | Format |
|---|---|
| `dist/sd-model(.min).js` | assigns a global `require`; `require('sd-model')` returns the exports. sd-utils is not bundled: it comes from the global `require` of `dist/sd-utils.js` (loaded before or after it). Format of browserify's `require` option, loaded by the tests of sd-computations and sd-tree-designer and the sd-computations job worker |
| `dist/standalone/sd-model(.min).js` | UMD with sd-utils bundled: the exports as `module.exports`, AMD module or global `SilverDecisions.Model` |

The plain files have inline source maps, the minified files external `.map` files.

## Development

Node 24 (`.nvmrc`); CI also builds and tests on Node 22. The library itself
runs in browsers (ES5 output) and does not require a Node version.

```bash
npm ci
npm run build        # clean dist/, Rollup (rollup.config.mjs) with Babel 7
npm test             # contract tests against dist/ (run the build first) and the Jasmine specs
npm run test:build   # isolated build check, see scripts/check-build.js
```

`npm test` runs the node:test contract tests in `test/contract/` against
`dist/standalone/sd-model.js` and the Jasmine specs in `test/specs/` against
the sources (compiled with `@babel/register` and the options of the
`browserify.transform` field). `SD_MODEL_TARGET` selects the variant the
contract tests load:

| Target | Tested code |
|---|---|
| `standalone`, `standalone.min` | `dist/standalone/sd-model(.min).js` |
| `module`, `module.min` | `dist/sd-model(.min).js`, loaded after `dist/sd-utils.js` of the installed sd-utils |
| `source` | `index.js` bundled with browserify and the package's `browserify.transform`, as SilverDecisions does |
| a file path | a CommonJS file exporting the package exports |

`SD_MODEL_DIST` points at another `dist/` directory, `SD_UTILS_BUNDLE` at
another sd-utils `require` bundle.

The contract tests cover the API used by sd-computations, sd-tree-designer
and SilverDecisions: exports and bundle globals, domain classes, editing
trees, ids and parent-child links, undo / redo, validation results, the DTO
and loading / saving of the diagram files in `test/contract/fixtures/` (saved
by SilverDecisions 0.5.2 to 1.2.0). Saved data is compared semantically with
an expectation derived from the file format, and load -> save -> load -> save
must give the same data after the first save. Randomness (ids) is mocked per
test with a seeded generator.

`npm run test:build` (CI on Linux) copies the working tree, runs `npm ci` and
the build, checks the six artifacts (ES5, parsed source maps) and that
nothing outside `dist/` changed, runs the contract tests against the four
bundles (plain and minified) and the sources and the Jasmine specs, packs the
package, installs the tarball into an empty consumer that bundles it with
browserify + babelify like SilverDecisions and tests that bundle, and checks
that a syntax error fails the build with a non-zero exit code. Windows CI
runs a smoke build, the tests and the check without the consumer install.
`--sd-utils=<sd-utils .tgz>` runs the check with an unreleased sd-utils
tarball instead of the locked version (not saved to `package.json` or the
lockfile).

`dist/` is committed and rebuilt by the release (`release-it` runs
`npm run build` and `npm test` after the version bump). Until then it is the
gulp/browserify build of the last release, `0.2.11`.
