import * as fs from 'fs-extra';
import { getTsc, getTSConfig } from './utils';
// TODO: rework next to ES6 style imports
const glob = require('glob-all');
const nodepath = require('path');

export function process(src, path, config) {
    const root = require('jest-util').getPackageRoot();
    const compilerOptions = getTSConfig(config.globals, config.collectCoverage);

    const isTsFile = path.endsWith('.ts') || path.endsWith('.tsx');
    const isJsFile = path.endsWith('.js') || path.endsWith('.jsx');
    const isHtmlFile = path.endsWith('.html');

    if (isHtmlFile && config.globals.__TRANSFORM_HTML__) {
        src = 'module.exports=`' + src + '`;';
    }

    const processFile = compilerOptions.allowJs === true
        ? isTsFile || isJsFile
        : isTsFile;

    if (processFile) {
        const tsc = getTsc(config.globals);
        const transpiled = tsc.transpileModule(
            src,
            {
                compilerOptions: compilerOptions,
                fileName: path
            });

        // strip root part from path
        // this results in a shorter filename which will also make the encoded base64 filename for the cache shorter
        // long file names could be problematic in some OS
        // see https://github.com/kulshekhar/ts-jest/issues/158
        path = path.startsWith(root) ? path.substr(root.length) : path;

        //store transpiled code contains source map into cache, except test cases
        if (!config.testRegex || !path.match(config.testRegex)) {
            fs.outputFileSync(nodepath.join(config.cacheDirectory, '/ts-jest/', new Buffer(path).toString('base64')), transpiled.outputText);
        }

        const start = transpiled.outputText.length > 12 ? transpiled.outputText.substr(1, 10) : '';

        const modified = start === 'use strict'
            ? `'use strict';require('ts-jest').install();${transpiled.outputText}`
            : `require('ts-jest').install();${transpiled.outputText}`;

        return modified;
    }

    return src;
}
