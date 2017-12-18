'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');

function dirExists(dirPath) {
  const F_OK = (fs.constants && fs.constants.F_OK) || fs['F_OK'];
  try {
    fs.accessSync(dirPath, F_OK);
    return fs.statSync(dirPath).isDirectory();
  } catch (e) {
    return false;
  }
}

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function getFiles(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return !fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function getIntegrationMockContent(file) {
  return `module.exports = require('../../../../${file}');`;
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
    if (!dirExists(testCaseNodeModules)) {
      fs.mkdirSync(testCaseNodeModules);
    }
    const testCaseModuleFolder = path.join(testCaseNodeModules, 'ts-jest');
    fsx.copySync('.', testCaseModuleFolder, {
      overwrite: true,
      filter: function(src, dest) {
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
