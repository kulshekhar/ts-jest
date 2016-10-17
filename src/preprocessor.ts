declare const global: any;

import * as nodepath from 'path';
const tsc = require('typescript');
const {getTSConfig, getJestConfig} = require('./utils');
const getPackageRoot = require('jest-util').getPackageRoot;
const glob = require('glob-all');

const root = getPackageRoot();
const { testRegex,
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
  global.__ts_coverage__cache__.coverageConfig = {collectCoverage, coverageDirectory, coverageReporters};
  global.__ts_coverage__cache__.coverageCollectFiles =
    collectCoverage &&
    testResultsProcessor &&
    collectCoverageFrom &&
    collectCoverageFrom.length ?
    glob.sync(collectCoverageFrom).map(x => nodepath.resolve(root, x)) : [];
}

module.exports = {
  process(src, path, config) {
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

      const modified = `require('ts-jest').install({environment: 'node', emptyCacheBetweenOperations: true});${transpiled.outputText}`;

      return modified;
    }

    return src;
  }
};