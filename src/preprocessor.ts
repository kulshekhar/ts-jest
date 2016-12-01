import * as tsc from 'typescript';
import * as nodepath from 'path';
import { getTSConfig, getJestConfig } from './utils';
// TODO: rework next to ES6 style imports
const glob = require('glob-all');
const getPackageRoot = require('jest-util').getPackageRoot;

declare const global: any;

const root = getPackageRoot();
const {
    testRegex,
    collectCoverage,
    coverageDirectory,
    coverageReporters,
    collectCoverageFrom,
    testResultsProcessor
} = getJestConfig(root);

//setting up cache to global object to resultprocessor consume
if (testResultsProcessor) {
    global.__ts_coverage__cache__ = {};
    global.__ts_coverage__cache__.sourceCache = {};
    global.__ts_coverage__cache__.coverageConfig = { collectCoverage, coverageDirectory, coverageReporters };
    global.__ts_coverage__cache__.coverageCollectFiles =
        collectCoverage &&
            testResultsProcessor &&
            collectCoverageFrom &&
            collectCoverageFrom.length ?
            glob.sync(collectCoverageFrom).map(x => nodepath.resolve(root, x)) : [];
}

export function process(src, path, config) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        const transpiled = tsc.transpileModule(
            src,
            {
                compilerOptions: getTSConfig(config.globals, collectCoverage),
                fileName: path
            });

        //store transpiled code contains source map into cache, except test cases
        if (global.__ts_coverage__cache__) {
            if (!testRegex || !path.match(testRegex)) {
                global.__ts_coverage__cache__.sourceCache[path] = transpiled.outputText;
            }
        }

        const start = transpiled.outputText.length > 12 ? transpiled.outputText.substr(1, 10) : '';

        const modified = start === 'use strict'
            ? `'use strict';require('ts-jest').install();${transpiled.outputText}`
            : `require('ts-jest').install();${transpiled.outputText}`;

        return modified;
    }

    return src;
}