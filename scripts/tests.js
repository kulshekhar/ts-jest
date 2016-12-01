process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs');

const argv = process.argv.slice(2);
argv.push('--no-cache');
// Watch unless on CI
if (!process.env.CI) {
  // argv.push('--watch');
}
// omit tests for watch cases if it runned on AppVeyor due to this issues:
// https://github.com/kulshekhar/ts-jest/issues/53
// http://help.appveyor.com/discussions/problems/5500-nodejs-child-process-with-watch-and-stderr-problem
if (process.env.AppVeyor) {
  argv.push('--testPathPattern', '^(?!(.*watch\.spec\.ts$)).*');
}

jest.run(argv);
