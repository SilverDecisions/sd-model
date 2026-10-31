# Changelog

## Unreleased

Changes since `0.2.11`. The version number is not changed yet, and the
committed `dist/` is still the `0.2.11` build.

### Build and tests

- The bundles are built with Rollup and Babel 7 instead of gulp/browserify,
  with the same formats, global names (`SilverDecisions.Model`, the global
  `require` exposing `sd-model`) and ES5 output. The UMD bundle registers an
  AMD module with an `exports` dependency instead of returning the exports,
  and extends an existing `SilverDecisions.Model` object instead of
  replacing it.
- The runtime dependencies are unchanged (`sd-utils` `^0.1.15`, in the
  lockfile with `lodash` 4.17.21 and `loglevel` 1.7.1).
- Tests: node:test contract tests (`test/contract/`), the Jasmine specs run in
  Node instead of Karma, `npm run test:build` checks the build in an isolated
  copy; GitHub Actions instead of Travis CI.
