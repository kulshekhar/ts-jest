// from: https://github.com/facebook/jest/blob/master/integration_tests/runJest.js

import { sync as spawnSync } from 'cross-spawn';
import * as path from 'path';
import * as Paths from '../../scripts/paths';

function runJestTestIn(
  dir: string,
  args: string[] = [],
  env = {},
): JestRunResult {
  if (!path.isAbsolute(dir)) {
    throw new Error(`You must give an absolute path to runJestTestIn().`);
  }

  const JEST_BIN = path.join(dir, 'node_modules', 'jest', 'bin', 'jest.js');

  const result = spawnSync(JEST_BIN, args, {
    cwd: dir,
    // Add both process.env which is the standard and custom env variables
    env: { ...process.env, ...env },
  });

  // Call to string on byte arrays and strip ansi color codes for more accurate string comparison.
  const stdout = result.stdout ? stripAnsiColors(result.stdout.toString()) : '';
  const stderr = result.stderr ? stripAnsiColors(result.stderr.toString()) : '';
  const output = result.output
    ? stripAnsiColors(result.output.join('\n\n'))
    : '';

  return { status: result.status, stderr, stdout, output };
}

// from https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
function stripAnsiColors(stringToStrip: string): string {
  return stringToStrip.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

export interface JestRunResult {
  status: number;
  stdout: string;
  stderr: string;
  output: string;
}

export function runTestCase(
  name: string,
  { env = {}, args = [] } = {},
): JestRunResult {
  return runJestTestIn(path.join(Paths.testsRootDir, name), args, env);
}

export function runE2eTest(
  name: string,
  { env = {}, args = [] } = {},
): JestRunResult {
  return runJestTestIn(path.join(Paths.e2eWorkDir, name), args, env);
}
