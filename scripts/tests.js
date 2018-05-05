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
  for (let i = 0; i < testCaseFolders.length; i++) {
    const testCaseNodeModules = path.join(
      testsRoot,
      testCaseFolders[i],
      'node_modules'
    );

    fsx.ensureDirSync(testCaseNodeModules);

    const testCaseModuleFolder = path.join(testCaseNodeModules, 'ts-jest');
    fsx.copySync(path.resolve('.'), testCaseModuleFolder, {
      overwrite: true,
      filter: function(src) {
        const shouldCopy =
          src === '.' ||
          src.startsWith('dist') ||
          src === 'package.json' ||
          src.endsWith('.js');
        return shouldCopy;
      },
    });
  }
}

createIntegrationMock();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--testPathPattern', '^(?!(.*watch.spec.ts$)).*');

jest.run(argv);
