// from: https://github.com/facebook/jest/blob/master/integration_tests/runJest.js

import { sync as spawnSync } from 'cross-spawn';
import * as path from 'path';
import { fileExists } from './utils';

// assuming that jest is installed globally
// using `npm i -g jest-cli`
const JEST_PATH = 'jest';

// return the result of the spawned proccess:
//  [ 'status', 'signal', 'output', 'pid', 'stdout', 'stderr',
//    'envPairs', 'options', 'args', 'file' ]
export default function runJest(dir: string, args: string[], env = {}): Result {
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

  // Call to string on byte arrays and strip ansi color codes for more accurate string comparison.
  result.stdout = result.stdout && stripAnsiColors(result.stdout.toString());
  result.stderr = result.stderr && stripAnsiColors(result.stderr.toString());
  result.output = result.output && stripAnsiColors(result.output.toString());

  return result;
}

// from https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
function stripAnsiColors(stringToStrip: String): String {
  return stringToStrip.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

export interface Result {
  stdout: string;
  stderr: string;
  status: number;
  output: string;
}
