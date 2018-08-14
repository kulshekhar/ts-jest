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

  run(logOutputUnlessStatusIs?: number): TestRunResult {
    const result = run(this.name, {
      ...this._options,
      template: this.templateName,
    });
    if (
      logOutputUnlessStatusIs != null &&
      logOutputUnlessStatusIs !== result.status
    ) {
      console.log(
        `Output of test run in "${this.name}" using template "${
          this.templateName
        } (exit code: ${result.status})":\n\n`,
        result.output.trim(),
      );
    }
    return result;
  }
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
  outputForSnapshot: string;
}

export default function configureTestCase(
  name: string,
  options: RunTestOptions = {},
): TestCaseRunDescriptor {
  return new TestCaseRunDescriptor(name, options);
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
  const outputForSnapshot = output
    .trim()
    // removes total and estimated time(s)
    .replace(
      /^(\s*Time\s*:\s*)[\d.]+m?s(?:(,\s*estimated\s+)[\d.]+m?s)?(\s*)$/gm,
      (_, start, estimatedPrefix, end) => {
        return `${start}XXs${
          estimatedPrefix ? `${estimatedPrefix}YYs` : ''
        }${end}`;
      },
    )
    // removes each test time(s)
    .replace(
      /^(\s*(?:✕|✓)\s+.+\s+\()[\d.]+m?s(\)\s*)$/gm,
      (_, start, end) => `${start}XXms${end}`,
    );

  return { status: result.status, stderr, stdout, output, outputForSnapshot };
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
