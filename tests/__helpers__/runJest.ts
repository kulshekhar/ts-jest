// from: https://github.com/facebook/jest/blob/master/integration_tests/runJest.js

const { fileExists } = require('./utils');
const path = require('path');
const spawnSync = require('cross-spawn').sync;

// assuming that jest is installed globally
// using `npm i -g jest-cli`
const JEST_PATH = 'jest';

// return the result of the spawned proccess:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJest(dir, args) {
  const isRelative = dir[0] !== '/';

  if (isRelative) {
    dir = path.resolve(__dirname, dir);
  }

  const localPackageJson = path.resolve(dir, 'package.json');
  if (!fileExists(localPackageJson)) {
    throw new Error(`
      Make sure you have a local package.json file at
        "${localPackageJson}".
      Otherwise Jest will try to traverse the directory tree and find the
      the global package.json, which will send Jest into infinite loop.
    `);
  }

  const result = spawnSync(JEST_PATH, args || [], {
    cwd: dir,
  });

  result.stdout = result.stdout && result.stdout.toString();
  result.stderr = result.stderr && result.stderr.toString();

  return result;
}
