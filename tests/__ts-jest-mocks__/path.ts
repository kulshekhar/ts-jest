import { } from 'jest';
import { } from 'node';

interface MockedPath {
  __setBaseDir(newBaseDir);
  resolve(args);
}

const path = require.requireActual('path');
const mockedPath = jest.genMockFromModule<MockedPath>('path');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let baseDir = '';
function __setBaseDir(newBaseDir) {
    baseDir = newBaseDir;
}

// A custom version of `readdirSync` that reads from the special mocked out
// file list set via __setMockFiles
function resolve(args) {
  return path.resolve(baseDir, args);
}

mockedPath.__setBaseDir = __setBaseDir;
mockedPath.resolve = resolve;

module.exports = mockedPath;