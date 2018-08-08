// tslint:disable-file:no-shadowed-variable
import { sync as spawnSync } from 'cross-spawn';
import { join } from 'path';
import * as Paths from '../../scripts/paths';
import * as fs from 'fs-extra';

const TEMPLATE_EXCLUDED_ITEMS = [
  'node_modules',
  'package.json',
  'package-lock.json',
];

class TestCaseRunDescriptor {
  // tslint:disable-next-line:variable-name
  protected _options: RunTestOptions;
  // tslint:disable-next-line:variable-name
  protected _sourcePackageJson: any;

  constructor(readonly name: string, options: RunTestOptions = {}) {
    this._options = { ...options };
  }

  get sourceDir() {
    return join(Paths.e2eSourceDir, this.name);
  }
  get templateWorkdir() {
    return join(Paths.e2eWorkTemplatesDir, this.name);
  }
  get workdir() {
    return join(Paths.e2eWorkDir, this.templateName, this.name);
  }

  get sourcePackageJson() {
    return (
      this._sourcePackageJson ||
      (this._sourcePackageJson = require(join(this.sourceDir, 'package.json')))
    );
  }

  get templateName() {
    if (!this._options.template) {
      // read the template from the package field if it is not given
      this._options.template = this.sourcePackageJson.e2eTemplate || 'default';
    }
    return this._options.template;
  }

  run(logUnlessStatus?: number): TestRunResult {
    const result = run(this.name, {
      ...this._options,
      template: this.templateName,
    });
    if (logUnlessStatus != null && logUnlessStatus !== result.status) {
      console.log(
        `Output of test run in "${this.name}" using template "${
          this.templateName
        } (exit code: ${result.status})":\n\n`,
        result.output.trim(),
      );
    }
    return result;
  }

  runWithTemplates<T extends string>(
    logUnlessStatus: number,
    // tslint:disable-next-line:trailing-comma
    ...templates: T[]
  ): TestRunResultsMap<T>;
  runWithTemplates<T extends string>(...templates: T[]): TestRunResultsMap<T>;
  runWithTemplates<T extends string>(
    logUnlessStatus: number | T,
    // tslint:disable-next-line:trailing-comma
    ...templates: T[]
  ): TestRunResultsMap<T> {
    if (typeof logUnlessStatus !== 'number') {
      templates.unshift(logUnlessStatus);
      logUnlessStatus = undefined;
    }
    if (templates.length < 1) {
      throw new RangeError(
        `There must be at least one template to run the test case with.`,
      );
    }
    if (!templates.every((t, i) => templates.indexOf(t, i + 1) === -1)) {
      throw new Error(
        `Each template must be unique. Given ${templates.join(', ')}`,
      );
    }
    return templates.reduce(
      (map, template) => {
        const desc = new TestCaseRunDescriptor(this.name, {
          ...this._options,
          template,
        });
        map[template as string] = desc.run(logUnlessStatus as number);
        return map;
      },
      {} as TestRunResultsMap<T>,
    );
  }
}

// tslint:disable-next-line:variable-name
export const TestRunResultFlag = Symbol.for('[ts-jest-test-run-result]');

export interface RunTestOptions {
  template?: string;
  env?: {};
  args?: string[];
}

export interface TestRunResult {
  [TestRunResultFlag]: true;
  status: number;
  stdout: string;
  stderr: string;
  output: string;
}

// tslint:disable-next-line:interface-over-type-literal
export type TestRunResultsMap<T extends string = string> = {
  [key in T]: TestRunResult
};

export default function configureTestCase(
  name: string,
  options: RunTestOptions = {},
): TestCaseRunDescriptor {
  return new TestCaseRunDescriptor(name, options);
}

export function sanitizeOutput(output: string): string {
  return (
    output
      .trim()
      // removes total and estimated times
      .replace(
        /^(\s*Time\s*:\s*)[\d.]+m?s(?:(,\s*estimated\s+)[\d.]+m?s)?(\s*)$/gm,
        (_, start, estimatedPrefix, end) => {
          return `${start}XXs${
            estimatedPrefix ? `${estimatedPrefix}YYs` : ''
          }${end}`;
        },
      )
      // removes each test time values
      .replace(
        /^(\s*(?:✕|✓)\s+.+\s+\()[\d.]+m?s(\)\s*)$/gm,
        (_, start, end) => `${start}XXms${end}`,
      )
  );
}

export function run(
  name: string,
  { args = [], env = {}, template }: RunTestOptions = {},
): TestRunResult {
  // we need to know if there is a test script, and if so use it instead of starting jest
  const pkg = require(join(Paths.e2eSourceDir, name, 'package.json'));
  if (!template) {
    template = pkg.e2eTempalte || 'default';
  }
  const dir = prepareTest(name, template);

  const prefix =
    pkg.scripts && pkg.scripts.test
      ? ['npm', '-s', 'run', 'test']
      : [join(dir, 'node_modules', '.bin', 'jest')];
  args = [...prefix, ...args];
  const cmd = args.shift();

  const result = spawnSync(cmd, args, {
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

  return {
    [TestRunResultFlag]: true,
    status: result.status,
    stderr,
    stdout,
    output,
  };
}

// from https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
function stripAnsiColors(stringToStrip: string): string {
  return stringToStrip.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

function prepareTest(name: string, template: string): string {
  const sourceDir = join(Paths.e2eSourceDir, name);
  // working directory is in the temp directory, different for each tempalte name
  const caseDir = join(Paths.e2eWorkDir, template, name);
  const templateDir = join(Paths.e2eWorkTemplatesDir, template);

  // ensure directory exists
  fs.mkdirpSync(caseDir);

  // copy source and test files
  fs.copySync(sourceDir, caseDir);

  // link the node_modules dir
  if (!fs.existsSync(join(caseDir, 'node_modules'))) {
    fs.symlinkSync(
      join(templateDir, 'node_modules'),
      join(caseDir, 'node_modules'),
    );
  }

  // copy all other files from the template to the case dir
  fs.readdirSync(templateDir).forEach(item => {
    if (TEMPLATE_EXCLUDED_ITEMS.includes(item)) {
      return;
    }
    fs.copySync(join(templateDir, item), join(caseDir, item));
  });

  return caseDir;
}
