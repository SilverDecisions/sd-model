#!/usr/bin/env node
// Build check in an isolated copy (`npm run test:build`, used by CI):
//
//  1. copy the files of the working tree (git ls-files) to a temp dir, `npm ci` there
//  2. `npm run build`: exit code 0, no Rollup warnings
//  3. all dist artifacts exist and are ES5; their source maps (inline in the plain
//     files, .map files for the minified ones) parse and map to the sources
//  4. the build changed nothing outside dist/
//  5. the contract tests against the four fresh bundles (dist/standalone and
//     dist/sd-model.js after dist/sd-utils.js, plain and minified) and the sources
//     bundled with browserify (target `source`), and the Jasmine specs
//  6. a syntax error injected into the sources fails `npm run build` with a
//     non-zero exit code and a diagnostic naming the file, nothing outside dist/ changes
//  7. `npm pack`: the tarball contains the entry points, sources and dist; it is
//     installed into an empty consumer that bundles it with browserify + babelify
//     (the package's browserify.transform field, like SilverDecisions), and the
//     contract tests run against that bundle
//
// Usage: node scripts/check-build.js [--keep] [--skip-consumer] [--sd-utils=<sd-utils .tgz>]
//   --sd-utils  install this sd-utils tarball in the copy and in the consumer instead
//               of the locked / published version (integration check of an
//               unreleased sd-utils; package.json and the lockfile of the working
//               tree are not changed)
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {spawnSync, execFileSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const NAME = 'sd-model';
const ERROR_FILE = 'src/data-model.js';
// the syntax error goes into this line (after the imports, outside comments)
const ERROR_LINE = 4;
const ARTIFACTS = ['', 'standalone/'].reduce((list, dir) => list.concat(
    ['.js', '.min.js', '.min.js.map'].map(ext => 'dist/' + dir + NAME + ext)), []);
// what consumers bundle: the entry points and the sources they import
const SOURCES = ['src/index.js', 'src/data-model.js', 'src/validation-result.js', 'src/domain/index.js',
    'src/domain/edge.js', 'src/domain/point.js', 'src/domain/text.js', 'src/domain/object-with-computed-values.js',
    'src/domain/object-with-id-and-editable-fields.js', 'src/domain/node/node.js', 'src/domain/node/decision-node.js',
    'src/domain/node/chance-node.js', 'src/domain/node/terminal-node.js'];
const PACKED = ['package.json', 'README.md', 'LICENSE', 'index.js', 'browser.index.js'].concat(SOURCES, ARTIFACTS);
// the toolchain SilverDecisions and the sd-* modules compile the package with
const CONSUMER_DEPS = ['browserify@17', 'babelify@10', '@babel/core@7', '@babel/preset-env@7',
    'babel-plugin-transform-class-properties@6', 'babel-plugin-transform-object-assign@6',
    'babel-plugin-transform-builtin-extend@1'];

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => (args.find(a => a.startsWith(name + '=')) || '').slice(name.length + 1) || null;
const sdUtilsTarball = option('--sd-utils') && path.resolve(option('--sd-utils'));
const failures = [];
const fail = msg => {
    failures.push(msg);
    console.error('FAIL ' + msg);
};
const ok = msg => console.log('ok   ' + msg);

// npm as `node npm-cli.js`: on Windows `npm` is a .cmd file that spawnSync cannot
// run without a shell. npm_execpath is set when this runs as an npm script.
const NPM_CLI = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    .find(p => p && /npm-cli\.js$/.test(p) && fs.existsSync(p));

function run(cmd, cmdArgs, opts) {
    const r = spawnSync(cmd, cmdArgs, Object.assign({encoding: 'utf8', maxBuffer: 64 * 1024 * 1024}, opts));
    return {status: r.status, stdout: r.stdout || '', log: (r.stdout || '') + (r.stderr || '')};
}

function npm(npmArgs, opts) {
    if (!NPM_CLI) {
        throw new Error('npm-cli.js not found next to ' + process.execPath);
    }
    return run(process.execPath, [NPM_CLI].concat(npmArgs), opts);
}

function hashTree(dir, skip) {
    const out = {};
    (function walk(rel) {
        for (const e of fs.readdirSync(path.join(dir, rel), {withFileTypes: true})) {
            const r = rel ? rel + '/' + e.name : e.name;
            if (skip.some(s => r === s || r.startsWith(s + '/'))) {
                continue;
            }
            if (e.isDirectory()) {
                walk(r);
            } else {
                out[r] = crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, r))).digest('hex');
            }
        }
    })('');
    return out;
}

function changedOutsideDist(dir, before) {
    const after = hashTree(dir, ['node_modules', 'dist']);
    return [...new Set(Object.keys(before).concat(Object.keys(after)))].filter(f => before[f] !== after[f]);
}

function copyTree(dest) {
    const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {cwd: root, encoding: 'utf8'})
        .split('\0').filter(f => f && fs.existsSync(path.join(root, f)));
    for (const f of files) {
        fs.mkdirSync(path.join(dest, path.dirname(f)), {recursive: true});
        fs.copyFileSync(path.join(root, f), path.join(dest, f));
    }
    return files.length;
}

// acorn from the isolated copy (installed by its `npm ci`)
let toolsDir = root;
function isES5(file) {
    const acorn = require(require.resolve('acorn', {paths: [toolsDir]}));
    try {
        acorn.parse(fs.readFileSync(file, 'utf8'), {ecmaVersion: 5});
        return null;
    } catch (e) {
        return e.message;
    }
}

// null if the file references a parsable source map (inline data: URL for the
// plain files, a .map file next to the minified ones) that maps to ERROR_FILE
function sourceMapProblem(file, minified) {
    const ref = /\/\/# sourceMappingURL=(\S+)\s*$/.exec(fs.readFileSync(file, 'utf8'));
    if (!ref) {
        return 'no sourceMappingURL comment at the end';
    }
    const inline = /^data:application\/json;(?:charset=utf-8;)?base64,/.exec(ref[1]);
    if (minified ? inline || ref[1] !== path.basename(file) + '.map' : !inline) {
        return 'expected ' + (minified ? 'a reference to ' + path.basename(file) + '.map' : 'an inline source map') + ', got ' + ref[1].slice(0, 40);
    }
    let map;
    try {
        map = JSON.parse(inline ? Buffer.from(ref[1].slice(inline[0].length), 'base64').toString('utf8')
            : fs.readFileSync(path.join(path.dirname(file), ref[1]), 'utf8'));
    } catch (e) {
        return 'source map is not readable JSON: ' + e.message;
    }
    if (map.version !== 3 || typeof map.mappings !== 'string' || !/[A-Za-z]/.test(map.mappings)) {
        return 'source map has no version 3 mappings';
    }
    if (!Array.isArray(map.sources) || !map.sources.some(s => s.split('\\').join('/').endsWith(ERROR_FILE))) {
        return 'source map does not list ' + ERROR_FILE;
    }
    if (map.sourcesContent && map.sourcesContent.length !== map.sources.length) {
        return 'source map sourcesContent does not match its sources';
    }
    return null;
}

function runTests(dir, target, env) {
    // TAP: the default reporter of Node 24 prints no summary lines to parse
    const r = run(process.execPath, ['--test', '--test-reporter=tap', 'test/contract/*.test.js'], {
        cwd: dir, env: Object.assign({}, process.env, {SD_MODEL_TARGET: target}, env)
    });
    const count = name => (r.log.match(new RegExp('^# ' + name + ' (\\d+)', 'm')) || [])[1];
    const summary = 'tests ' + count('tests') + ', pass ' + count('pass') + ', fail ' + count('fail') + ', skipped ' + count('skipped');
    if (r.status === 0 && count('fail') === '0' && Number(count('pass')) > 0) {
        ok('contract tests on ' + target + ': ' + summary);
    } else {
        console.error(r.log.split('\n').filter(l => /^not ok|error:|expected|actual/.test(l)).slice(0, 30).join('\n'));
        fail('contract tests on ' + target + ': ' + summary);
    }
}

function runJasmine(dir) {
    const r = run(process.execPath, [path.join(dir, 'node_modules', 'jasmine', 'bin', 'jasmine.js'), '--config=test/jasmine.json'], {cwd: dir});
    const summary = (/^\d+ specs?, \d+ failures?.*$/m.exec(r.log) || ['no summary'])[0];
    r.status === 0 && / 0 failures/.test(summary) ? ok('Jasmine specs (sources): ' + summary) : fail('Jasmine specs: ' + summary + '\n' + r.log.slice(-2000));
}

function main() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), NAME + '-check-'));
    const copy = path.join(tmp, 'copy');
    console.log('isolated copy: ' + copy);
    try {
        // 1
        ok('copied ' + copyTree(copy) + ' files');
        let r = npm(['ci', '--no-audit', '--no-fund'], {cwd: copy});
        if (r.status !== 0) {
            console.error(r.log);
            fail('npm ci exited with ' + r.status);
            return;
        }
        ok('npm ci');
        toolsDir = copy;
        if (sdUtilsTarball) {
            r = npm(['install', '--no-save', '--no-audit', '--no-fund', sdUtilsTarball], {cwd: copy});
            if (r.status !== 0) {
                console.error(r.log);
                fail('installing ' + sdUtilsTarball + ' failed');
                return;
            }
            ok('sd-utils from ' + path.basename(sdUtilsTarball) + ' (not saved)');
        }
        const version = name => require(path.join(copy, 'node_modules', name, 'package.json')).version;
        ok('installed sd-utils ' + version('sd-utils') + ' with lodash ' + version('lodash') + ', loglevel ' + version('loglevel'));

        // 2
        const before = hashTree(copy, ['node_modules', 'dist']);
        r = npm(['run', 'build'], {cwd: copy});
        if (r.status !== 0) {
            console.error(r.log);
            fail('npm run build exited with ' + r.status);
            return;
        }
        const warnings = r.log.split('\n').filter(l => /^\(!\)|\[!\]/.test(l.replace(/\u001b\[[\d;]*m/g, '')));
        warnings.length ? fail('build warnings:\n' + warnings.join('\n')) : ok('npm run build, no warnings');

        // 3
        for (const a of ARTIFACTS) {
            const f = path.join(copy, a);
            if (!fs.existsSync(f) || !fs.statSync(f).size) {
                fail(a + ' missing or empty');
                continue;
            }
            if (a.endsWith('.js')) {
                const err = isES5(f);
                err ? fail(a + ' is not ES5: ' + err) : null;
                const problem = sourceMapProblem(f, a.endsWith('.min.js'));
                problem ? fail(a + ': ' + problem) : null;
            }
        }
        const extra = fs.readdirSync(path.join(copy, 'dist'), {recursive: true})
            .map(f => 'dist/' + String(f).split(path.sep).join('/'))
            .filter(f => fs.statSync(path.join(copy, f)).isFile() && !ARTIFACTS.includes(f));
        extra.length ? fail('unexpected files in dist/: ' + extra.join(', ')) : null;
        ok(ARTIFACTS.length + ' artifacts checked (ES5, source maps parsed)');

        // 4
        const changed = changedOutsideDist(copy, before);
        changed.length ? fail('build changed files outside dist/: ' + changed.join(', ')) : ok('nothing changed outside dist/');

        // 5
        for (const target of ['standalone', 'standalone.min', 'module', 'module.min', 'source']) {
            runTests(copy, target);
        }
        runJasmine(copy);

        // 7 (before 6, which breaks the sources of its own copy)
        if (!flag('--skip-consumer')) {
            checkPackage(tmp, copy);
        }

        // 6
        const broken = path.join(tmp, 'broken');
        fs.cpSync(copy, broken, {recursive: true});
        const errorFile = path.join(broken, ERROR_FILE);
        const lines = fs.readFileSync(errorFile, 'utf8').split('\n');
        lines.splice(ERROR_LINE - 1, 0, 'var = ;');
        fs.writeFileSync(errorFile, lines.join('\n'));
        const beforeBroken = hashTree(broken, ['node_modules', 'dist']);
        r = npm(['run', 'build'], {cwd: broken});
        const named = r.log.includes(ERROR_FILE.split('/').pop()) && new RegExp('\\(' + ERROR_LINE + ':\\d+\\)|:' + ERROR_LINE + ':\\d+').test(r.log);
        if (r.status === 0) {
            fail('npm run build with a syntax error in ' + ERROR_FILE + ' exited with 0');
        } else if (!named) {
            console.error(r.log.split('\n').slice(0, 25).join('\n'));
            fail('no diagnostic naming ' + ERROR_FILE + ' line ' + ERROR_LINE);
        } else {
            ok('syntax error in ' + ERROR_FILE + ': exit code ' + r.status + ', diagnostic names line ' + ERROR_LINE);
        }
        const brokenChanged = changedOutsideDist(broken, beforeBroken);
        brokenChanged.length ? fail('failed build changed files outside dist/: ' + brokenChanged.join(', ')) : null;
    } finally {
        if (flag('--keep')) {
            console.log('kept ' + tmp);
        } else {
            fs.rmSync(tmp, {recursive: true, force: true});
        }
    }
}

function checkPackage(tmp, copy) {
    let r = npm(['pack', '--json', '--pack-destination', tmp], {cwd: copy});
    if (r.status !== 0) {
        console.error(r.log);
        fail('npm pack exited with ' + r.status);
        return;
    }
    // stdout only: npm 11 writes warnings (e.g. gitignore-fallback) to stderr
    const info = JSON.parse(r.stdout.slice(r.stdout.indexOf('[')))[0];
    const files = info.files.map(f => f.path);
    const missing = PACKED.filter(f => !files.includes(f));
    missing.length ? fail('tarball misses ' + missing.join(', ')) : ok('tarball ' + info.filename + ': ' + files.length + ' files, '
        + Math.round(info.size / 1024) + ' KiB, contains ' + PACKED.length + ' required files');

    const consumer = path.join(tmp, 'consumer');
    fs.mkdirSync(consumer);
    fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({name: 'consumer', private: true}));
    const packages = [path.join(tmp, info.filename)].concat(sdUtilsTarball ? [sdUtilsTarball] : [], CONSUMER_DEPS);
    r = npm(['install', '--no-audit', '--no-fund', '--no-package-lock'].concat(packages), {cwd: consumer});
    if (r.status !== 0) {
        console.error(r.log);
        fail('installing the tarball into a consumer failed');
        return;
    }
    const installed = require(path.join(consumer, 'node_modules', NAME, 'package.json'));
    const sdUtils = require(path.join(consumer, 'node_modules', 'sd-utils', 'package.json'));
    ok('installed ' + NAME + '@' + installed.version + ' from the tarball (sd-utils ' + sdUtils.version + ') with ' + CONSUMER_DEPS.join(' '));

    fs.writeFileSync(path.join(consumer, 'entry.js'), "module.exports = require('" + NAME + "');\n");
    const bundle = path.join(consumer, 'bundle.js');
    r = run(process.execPath, [path.join(consumer, 'node_modules', 'browserify', 'bin', 'cmd.js'),
        'entry.js', '--standalone', 'Consumer', '-o', bundle], {cwd: consumer});
    if (r.status !== 0) {
        console.error(r.log);
        fail('browserify of the installed package failed');
        return;
    }
    const err = isES5(bundle);
    err ? fail('consumer bundle is not ES5: ' + err) : ok('browserify bundle of require(\'' + NAME + '\') is ES5');
    runTests(copy, bundle);
}

main();
if (failures.length) {
    console.error('\n' + failures.length + ' check(s) failed');
    process.exit(1);
}
console.log('\nall build checks passed');
