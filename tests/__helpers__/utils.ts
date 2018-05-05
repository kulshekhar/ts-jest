import * as fs from 'fs';
// from: https://github.com/facebook/jest/blob/master/integration_tests/utils.js
import { sync as spawnSync } from 'cross-spawn';
import * as path from 'path';

export function run(cmd, cwd) {
  const args = cmd.split(/\s/).slice(1);
  const spawnOptions = { cwd };
  const result = spawnSync(cmd.split(/\s/)[0], args, spawnOptions);

  if (result.status !== 0) {
    const message = `
      ORIGINAL CMD: ${cmd}
      STDOUT: ${result.stdout && result.stdout.toString()}
      STDERR: ${result.stderr && result.stderr.toString()}
      STATUS: ${result.status}
      ERROR: ${result.error}
    `;
    throw new Error(message);
  }

  return result;
}
