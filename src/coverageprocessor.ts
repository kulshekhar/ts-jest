declare const global: {
  __ts_coverage__cache__: {
    coverageConfig: any;
    sourceCache: any[];
    coverageCollectFiles: any[];
  }
}

import * as path from 'path';

import includes = require('lodash.includes');
import partition = require('lodash.partition');
const loadCoverage = require('remap-istanbul/lib/loadCoverage');
const remap = require('remap-istanbul/lib/remap');
const writeReport = require('remap-istanbul/lib/writeReport');
const istanbulInstrument = require('istanbul-lib-instrument');
import pickBy = require('lodash.pickby')

interface CoverageMap {
  merge: (data: Object) => void;
  getCoverageSummary: () => Object;
  data: Object;
  addFileCoverage: (fileCoverage: Object) => void;
}

// full type https://github.com/facebook/jest/blob/master/types/TestResult.js
interface Result {
  coverageMap: CoverageMap;
}

function processResult(result: Result): Result {
  if (!global.__ts_coverage__cache__) return result;
  const { coverageConfig, sourceCache, coverageCollectFiles } = global.__ts_coverage__cache__;
  if (!coverageConfig.collectCoverage) return result;

  const coveredFiles = Object.keys(sourceCache)
  const coverage = [pickBy(result.coverageMap.data, (_, fileName) => includes(coveredFiles, fileName))]

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
  return result;
}

module.exports = processResult;