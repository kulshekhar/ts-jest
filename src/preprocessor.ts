import * as fs from 'fs-extra';
import * as tsc from 'typescript';
import {getTSConfig} from './utils';
// TODO: rework next to ES6 style imports
const glob = require('glob-all');
const nodepath = require('path');

export function process(src, path, config) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        const transpiled = tsc.transpileModule(
            src,
            {
                compilerOptions: getTSConfig(config.globals, config.collectCoverage),
                fileName: path
            });

        //store transpiled code contains source map into cache, except test cases
        if (!config.testRegex || !path.match(config.testRegex)) {
            fs.outputFileSync(nodepath.join(config.cacheDirectory, '/ts-jest/', path), transpiled.outputText);
        }

        const start = transpiled.outputText.length > 12 ? transpiled.outputText.substr(1, 10) : '';

        return start === 'use strict'
            ? `'use strict';require('ts-jest').install();${transpiled.outputText}`
            : `require('ts-jest').install();${transpiled.outputText}`;
    }

    return src;
}