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

export function linkJestPackage(packageName, cwd) {
  const packagesDir = path.resolve(__dirname, '../packages');
  const packagePath = path.resolve(packagesDir, packageName);
  const destination = path.resolve(cwd, 'node_modules/');
  run(`mkdir -p ${destination}`, undefined);
  return run(`ln -sf ${packagePath} ${destination}`, undefined);
}

export function fileExists(filePath) {
  const F_OK = (fs.constants && fs.constants.F_OK) || <number>fs['F_OK'];
  try {
    fs.accessSync(filePath, F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
