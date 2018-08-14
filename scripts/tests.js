#!/usr/bin/env node
'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs-extra');
const path = require('path');
const Paths = require('./paths');

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function isJestFolder(basename) {
  return basename.startsWith('__') && basename.endsWith('__');
}

// TODO: later we could add a `.test-case-keep` empty file in each folder?
// ...or move all into a `test-cases` dedicated directory
function isTestCaseFolder(basename) {
  return !isJestFolder(basename);
}

function createIntegrationMock() {
  // copy files for simple integration tests
  const testsRoot = 'tests';
  const testCaseFolders = getDirectories(testsRoot).filter(isTestCaseFolder);

  testCaseFolders.forEach(directory => {
    const testCaseNodeModules = path.join(testsRoot, directory, 'node_modules');

    const rootDir = path.resolve('.');
    const testCaseModuleFolder = path.join(testCaseNodeModules, 'ts-jest');

    // Copy package.json
    fs.copySync(
      path.resolve(rootDir, 'package.json'),
      path.resolve(testCaseModuleFolder, 'package.json')
    );

    // TODO: remove this in next major version as well as the test, and the preprocessor.js file in root
    // Copy preprocessor.js
    fs.copySync(
      path.resolve(rootDir, 'preprocessor.js'),
      path.resolve(testCaseModuleFolder, 'preprocessor.js')
    );

    // Copy dist folder
    fs.copySync(
      path.resolve(rootDir, 'dist'),
      path.resolve(testCaseModuleFolder, 'dist')
    );
  });
}

createIntegrationMock();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--config', path.join(Paths.rootDir, 'jest.config.tests.js'));
jest.run(argv);
