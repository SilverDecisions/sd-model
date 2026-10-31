// Compiles the sources for the Jasmine specs in Node (`npm test`) with the Babel
// options of the package's browserify.transform field, as consumers bundle them.
// sd-utils is an ES module source package as well and is compiled with the same
// options (its own browserify.transform field).
'use strict';

const pkg = require('../package.json');

require('@babel/register')(Object.assign({}, pkg.browserify.transform[0][1], {
    babelrc: false,
    configFile: false,
    ignore: [/[\\/]node_modules[\\/](?!sd-utils[\\/])/]
}));
