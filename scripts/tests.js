'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs');
const fsx = require('fs-extra');
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

    // Copy javascript files
    fsx.copySync(
      path.resolve(rootDir, 'index.js'),
      path.resolve(testCaseModuleFolder, 'index.js')
    );
    fsx.copySync(
      path.resolve(rootDir, 'preprocessor.js'),
      path.resolve(testCaseModuleFolder, 'preprocessor.js')
    );

    // Copy package.json
    fsx.copySync(
      path.resolve(rootDir, 'package.json'),
      path.resolve(testCaseModuleFolder, 'package.json')
    );

    // Copy dist folder
    fsx.copySync(
      path.resolve(rootDir, 'dist'),
      path.resolve(testCaseModuleFolder, 'dist')
    );
  });
}

createIntegrationMock();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--testPathPattern', '^(?!(.*watch.spec.ts$)).*');

jest.run(argv);
