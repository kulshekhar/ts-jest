declare const global: any;

import * as path from 'path';

const partition = require('lodash.partition');
const loadCoverage = require('remap-istanbul/lib/loadCoverage');
const remap = require('remap-istanbul/lib/remap');
const writeReport = require('remap-istanbul/lib/writeReport');
const istanbulInstrument = require('istanbul-lib-instrument');

function processResult(result: any): void {
  const { coverageConfig, sourceCache, coverageCollectFiles } = global.__ts_coverage__cache__;
  if (!coverageConfig.collectCoverage) {
    return;
  }

  const coverage = result.testResults.map(value => value.coverage);
  const coveredFiles = coverage.reduce((acc, x) =>  acc.concat(Object.keys(x)), []);
  const uncoveredFiles = partition(coverageCollectFiles, x => coveredFiles.includes(x))[1];
  const coverageOutputPath = path.join(coverageConfig.coverageDirectory, 'remapped');

  //generate 'empty' coverage against uncovered files
  const emptyCoverage = uncoveredFiles.map(x => {
    const instrumenter = istanbulInstrument.createInstrumenter();
    instrumenter.instrumentSync(sourceCache[x], x);
    const ret = {};
    ret[x] = instrumenter.fileCoverage;
    return ret;
  });

  const mergedCoverage = loadCoverage(coverage.concat(emptyCoverage), { readJSON: (t) => t });
  const coverageCollector = remap(mergedCoverage, {
    readFile: (x) => {
      const key = path.normalize(x);
      const source = sourceCache[key];
      delete global.__ts_coverage__cache__.sourceCache[key];
      return source;
    }
  });

  writeReport(coverageCollector, 'html', {}, path.join(coverageOutputPath, 'html'));
  writeReport(coverageCollector, 'lcovonly', {}, path.join(coverageOutputPath, 'lcov.info'));
  writeReport(coverageCollector, 'json', {}, path.join(coverageOutputPath, 'coverage.json'));
}

module.exports = processResult;