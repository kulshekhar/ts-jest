// from: https://github.com/facebook/jest/blob/master/integration_tests/utils.js
import { sync as spawnSync } from 'cross-spawn';
import { Result } from './runJest';

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

// tslint:disable
export function printStdStreams(result: Result) {
  console.log('Process status code: ', result.status);
  console.log('---STDOUT---');
  console.log(result.stdout);
  console.log('---STDERR---');
  console.log(result.stderr);
  console.log('---END---');
}
// tslint:enable

// Asserts the status of jest - if it is incorrect it dumps all the streams
export function expectJestStatus(result: Result, expectedStatus: number) {
  if (result.status !== expectedStatus) {
    printStdStreams(result);
  }
  expect(result.status).toBe(expectedStatus);
}
