declare const global: any;

import * as path from 'path';

const includes = require('lodash.includes');
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
  const coveredFiles = coverage.reduce((acc, x) => x ? acc.concat(Object.keys(x)) : acc, []);
  const uncoveredFiles = partition(coverageCollectFiles, x => includes(coveredFiles, x))[1];
  const coverageOutputPath = path.join(coverageConfig.coverageDirectory || 'coverage', 'remapped');

  //generate 'empty' coverage against uncovered files.
  //If source is non-ts passed by allowJS, return empty since not able to lookup from cache
  const emptyCoverage = uncoveredFiles.map(x => {
    var ret = {};
    if (sourceCache[x]) {
        var instrumenter = istanbulInstrument.createInstrumenter();
        instrumenter.instrumentSync(sourceCache[x], x);
        ret[x] = instrumenter.fileCoverage;
    }
    return ret;
  });

  const mergedCoverage = loadCoverage(coverage.concat(emptyCoverage), { readJSON: (t) => t ? t : {} });
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
  writeReport(coverageCollector, 'text', {}, path.join(coverageOutputPath, 'coverage.txt'));
}

module.exports = processResult;