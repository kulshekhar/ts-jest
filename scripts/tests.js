'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs-extra');
const path = require('path');

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function createIntegrationMock() {
  const testsRoot = 'tests';
  const testCaseFolders = getDirectories(testsRoot).filter(function(testDir) {
    return !(testDir.startsWith('__') && testDir.endsWith('__'));
  });

  testCaseFolders.forEach(directory => {
    const testCaseNodeModules = path.join(testsRoot, directory, 'node_modules');

    const rootDir = path.resolve('.');
    const testCaseModuleFolder = path.join(testCaseNodeModules, 'ts-jest');

    // Copy package.json
    fs.copySync(
      path.resolve(rootDir, 'package.json'),
      path.resolve(testCaseModuleFolder, 'package.json')
    );

    // Copy dist folder
    fs.copySync(
      path.resolve(rootDir, 'dist'),
      path.resolve(testCaseModuleFolder, 'dist')
    );
  });
}

createIntegrationMock();

// HACK: allow us to change the `startDir()` during tests
process.env.__RUNNING_TS_JEST_TESTS = Date.now();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--testPathPattern', '^(?!(.*watch.spec.ts$)).*');

jest.run(argv);
