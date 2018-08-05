import { sync as spawnSync } from 'cross-spawn';
import { join } from 'path';
import * as Paths from '../../scripts/paths';
import * as fs from 'fs-extra';

// jest augmentation
import 'jest';
declare global {
  namespace jest {
    interface Matchers<R> {
      toRunWithExitCode(expectedExitCode: number): R;
    }
  }
}

export interface TestCaseDesc {
  isTestCaseDesc: true;
  name: string;
  options: RunTestOptions;
  run(options?: RunTestOptions): TestRunResult;
}

export interface RunTestOptions {
  template?: string;
  env?: {};
  args?: string[];
}

export interface TestRunResult {
  status: number;
  stdout: string;
  stderr: string;
  output: string;
}

export default function testCase(
  name: string,
  options: RunTestOptions = {},
): TestCaseDesc {
  return {
    isTestCaseDesc: true,
    name,
    options,
    run(opt?: RunTestOptions): TestRunResult {
      return run(this.name, { ...this.options, ...opt });
    },
  };
}

export function run(
  name: string,
  { args = [], env = {}, template }: RunTestOptions = {},
): TestRunResult {
  const dir = prepareTest(name, template);

  const JEST_BIN = join(dir, 'node_modules', 'jest', 'bin', 'jest.js');

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

function prepareTest(name: string, template?: string): string {
  const sourceDir = join(Paths.e2eSourceDir, name);

  // read the template from the package field if it is not given
  if (!template) {
    template =
      require(join(sourceDir, 'package.json')).e2eTemplate || 'default';
  }
  // working directory is in the temp directory, different for each tempalte name
  const caseDir = join(Paths.e2eWorkDir, template, name);
  const templateDir = join(Paths.e2eWorkTemplatesDir, template);

  // ensure directory exists
  fs.mkdirpSync(caseDir);

  // copy source and test files
  fs.copySync(sourceDir, caseDir);

  // link the node_modules dir
  fs.symlinkSync(
    join(templateDir, 'node_modules'),
    join(caseDir, 'node_modules'),
  );

  return caseDir;
}

export function extendJest() {
  expect.extend({
    toRunWithExitCode(received: TestCaseDesc, expectedStatus: number) {
      if (!(received && received.isTestCaseDesc)) {
        throw new TypeError(
          `The received argument must be of type TestCaseDesc. use testCase() from test helpers to create one.`,
        );
      }
      // run the test
      const { status, output } = received.run();

      // return jest expected data
      const pass: boolean = expectedStatus === status;
      const coloredStatus = expectedStatus
        ? this.utils.RECEIVED_COLOR(expectedStatus.toString())
        : this.utils.EXPECTED_COLOR(expectedStatus.toString());
      if (pass) {
        return {
          message: () =>
            `expected test case "${
              received.name
            }" to not exit with status ${coloredStatus}` +
            ` when using template "${received.options.template}"` +
            `\n\nOutput:\n  ${this.utils.printReceived(output)}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected test case "${
              received.name
            }" to exit with status ${coloredStatus}` +
            ` when using template "${received.options.template}"` +
            `\n\nOutput:\n  ${this.utils.printReceived(output)}`,
          pass: false,
        };
      }
    },
  });
}
