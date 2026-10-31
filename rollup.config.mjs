// JavaScript build (`npm run build`). Each bundle is written as a plain file with
// an inline source map and as a minified file with an external .map, like the
// previous gulp/browserify build:
//   dist/sd-model(.min).js             defines a global `require` that returns the
//                                      exports of index.js for require('sd-model');
//                                      sd-utils is external and comes from the global
//                                      `require` of dist/sd-utils.js (format of
//                                      browserify's `require` option)
//   dist/standalone/sd-model(.min).js  UMD of index.js with sd-utils (and lodash,
//                                      loglevel) bundled: module.exports, AMD module
//                                      or SilverDecisions.Model
import {babel} from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {requireBundle} from './scripts/require-bundle.mjs';

const NAME = 'sd-model';

// The Babel options of the `browserify.transform` field in package.json, which
// consumers use to compile index.js and src/ (and sd-utils with the same options
// from its own package.json): ES5 (no targets), class fields as assignments.
// lodash and loglevel are ES5 already and not compiled.
const babelPlugin = () => babel({
    babelHelpers: 'bundled',
    babelrc: false,
    configFile: false,
    exclude: /[\\/]node_modules[\\/](?!sd-utils[\\/])/,
    presets: ['@babel/preset-env'],
    plugins: [
        'transform-class-properties',
        'transform-object-assign',
        ['babel-plugin-transform-builtin-extend', {globals: ['Error']}]
    ]
});

const plugins = () => [
    nodeResolve(),
    commonjs({transformMixedEsModules: true}),
    babelPlugin()
];

function outputs(file, output) {
    // freeze: false keeps the `domain` namespace object extensible, as the
    // exports object of the browserify build
    const common = Object.assign({exports: 'named', esModule: true, freeze: false}, output);
    return [
        Object.assign({file: file + '.js', sourcemap: 'inline'}, common),
        Object.assign({file: file + '.min.js', sourcemap: true, plugins: [terser()]}, common)
    ];
}

export default [
    {
        input: 'index.js',
        external: ['sd-utils'],
        plugins: plugins().concat([requireBundle(NAME)]),
        output: outputs('dist/' + NAME, {format: 'cjs'})
    },
    {
        input: 'index.js',
        plugins: plugins(),
        output: outputs('dist/standalone/' + NAME, {format: 'umd', name: 'SilverDecisions.Model', extend: true})
    }
];
