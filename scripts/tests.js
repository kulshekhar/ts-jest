'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

const jest = require('jest');
const fs = require('fs');
const path = require('path');

function dirExists(dirPath) {
    const F_OK = fs.constants && fs.constants.F_OK || fs['F_OK'];
    try {
        fs.accessSync(dirPath, F_OK);
        return fs.statSync(dirPath).isDirectory();
    } catch (e) {
        return false;
    }
}

function getDirectories(rootDir) {
    return fs.readdirSync(rootDir).filter(function (file) {
        return fs.statSync(path.join(rootDir, file)).isDirectory();
    });
}

function getFiles(rootDir) {
    return fs.readdirSync(rootDir).filter(function (file) {
        return !fs.statSync(path.join(rootDir, file)).isDirectory();
    });
}

function getIntegrationMockContent(file) {
    return `module.exports = require('../../../../${file}');`;
}

function createIntegrationMock() {
    const testsRoot = 'tests';
    const testCaseFolders = getDirectories(testsRoot).filter(function (testDir) {
        return !(testDir.startsWith('__') && testDir.endsWith('__'));
    });
    const filesToMock = getFiles('dist').filter(function (fileName) {
        return fileName.endsWith('.js')
    })
    for (let i = 0; i < testCaseFolders.length; i++) {
        const testCaseNodeModules = path.join(testsRoot, testCaseFolders[i], 'node_modules');
        if (!dirExists(testCaseNodeModules)) {
            fs.mkdirSync(testCaseNodeModules);
            const testCaseModuleFolder = path.join(testCaseNodeModules, 'ts-jest')
            fs.mkdirSync(testCaseModuleFolder);
            filesToMock.forEach(function (fileName) {
                const integrationMockPath = path.join(testCaseModuleFolder, fileName);
                fs.appendFileSync(integrationMockPath, getIntegrationMockContent(fileName));
            })
        }
    }
}

createIntegrationMock();

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
