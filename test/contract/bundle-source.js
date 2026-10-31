// Prints a browserify bundle of index.js (CommonJS `module.exports` = the
// package exports) to stdout. Like SilverDecisions, it relies on the
// browserify.transform fields of sd-model and sd-utils to compile their ES2015+
// sources with Babel. Used by test/contract/load.js for SD_MODEL_TARGET=source.
'use strict';

const path = require('path');
const browserify = require('browserify');

const root = path.resolve(__dirname, '..', '..');

browserify(path.join(root, 'index.js'), {basedir: root, standalone: 'SdModelSourceBundle'})
    .bundle((err, buf) => {
        if (err) {
            console.error(err.stack || String(err));
            process.exit(1);
        }
        process.stdout.write(buf);
    });
