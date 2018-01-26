// from: https://github.com/facebook/jest/blob/master/integration_tests/runJest.js

import { spawnProcess } from './promisify-spawn';
import * as path from 'path';
import { fileExists } from './utils';

// assuming that jest is installed globally
// using `npm i -g jest-cli`
const JEST_PATH = 'jest';

// return the result of the spawned proccess:
//  [ 'status', 'signal', 'output',  'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default async function runJest(
  dir: string,
  args: string[],
): Promise<JestResult> {
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

  return spawnProcess(JEST_PATH, args || [], {
    cwd: dir,
  });
}

export interface JestResult {
  stderr: string;
  stdout: string;
  output: string;
  status: number;
}
