# Changelog

## Unreleased

Changes since `0.2.11`. The version number is not changed yet, and the
committed `dist/` is still the `0.2.11` build.

### Behaviour changes (bug fixes)

- `DataModel.convertNode` (via `replaceNode`) sets `$parent` of the children
  to the new node. They kept pointing to the replaced node, which is no
  longer in the model: sd-computations then initialised the expression scope
  of the children from that node (variable values of the time of the
  conversion), and sd-tree-designer treated the children of a selected
  converted node as separate subtrees (copy and paste duplicated them).
  Saving and loading the diagram repaired the links.
- `DataModel.cloneSubtree` (copy / paste) copies the field status
  (`$fieldStatus`) of the nodes and edges and the computed values of the
  nodes deeply. The copy shared these objects with the original: marking a
  field of the pasted copy as invalid also marked the original field, and
  sd-computations then skipped the evaluation of the original's expression.

### Build and tests

- The bundles are built with Rollup and Babel 7 instead of gulp/browserify,
  with the same formats, global names (`SilverDecisions.Model`, the global
  `require` exposing `sd-model`) and ES5 output. The UMD bundle registers an
  AMD module with an `exports` dependency instead of returning the exports,
  and extends an existing `SilverDecisions.Model` object instead of
  replacing it.
- The runtime dependencies are unchanged (`sd-utils` `^0.1.15`, with
  `loglevel` 1.7.1 in the lockfile).

### Dependencies

- The lockfile resolves `lodash` (a dependency of sd-utils 0.1.15, range
  `^4.17.21`) to 4.18.1 instead of 4.17.21: security fixes only (prototype
  pollution in `_.unset`/`_.omit`, `_.template` imports validation).
  `dist/standalone` bundles lodash, so the next release build contains
  4.18.1. Consumers resolve lodash with their own lockfiles; bundles built
  earlier (e.g. the published `dist/` of sd-utils 0.1.15) are not changed.
- Tests: node:test contract tests (`test/contract/`), the Jasmine specs run in
  Node instead of Karma, `npm run test:build` checks the build in an isolated
  copy; GitHub Actions instead of Travis CI.
