// tslint:disable-file:no-shadowed-variable
import { sync as spawnSync } from 'cross-spawn';
import { join } from 'path';
import * as Paths from '../../scripts/paths';
import * as fs from 'fs-extra';

const TEMPLATE_EXCLUDED_ITEMS = ['node_modules', 'package-lock.json'];

type RunWithTemplatesIterator = (
  runtTest: () => TestRunResult,
  context: RunWithTemplateIteratorContext,
) => void;

interface RunWithTemplateIteratorContext {
  templateName: string;
  describeLabel: string;
  itLabel: string;
  testLabel: string;
}

function createIteratorContext(
  templateName: string,
  expectedStatus?: number,
): RunWithTemplateIteratorContext {
  const actionForExpectedStatus = (status?: number): string => {
    if (status == null) {
      return 'run';
    }
    return status === 0 ? 'pass' : 'fail';
  };
  return {
    templateName,
    describeLabel: `with template "${templateName}"`,
    itLabel: `should ${actionForExpectedStatus(expectedStatus)}`,
    testLabel: `should ${actionForExpectedStatus(
      expectedStatus,
    )} using template "${templateName}"`,
  };
}

class TestCaseRunDescriptor {
  protected _options: RunTestOptions;
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

  get templateName(): string {
    if (!this._options.template) {
      // read the template from the package field if it is not given
      this._options.template = this.sourcePackageJson.e2eTemplate || 'default';
    }
    return this._options.template as string;
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
    templates: T[],
    expectedStatus?: number,
    iterator?: RunWithTemplatesIterator,
  ): TestRunResultsMap<T> {
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
        const runTest = () => {
          const out = desc.run(expectedStatus);
          map[template] = { ...out };
          return out;
        };
        if (iterator) {
          iterator(runTest, createIteratorContext(template, expectedStatus));
        } else {
          runTest();
        }
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

export function configureTestCase(
  name: string,
  options: RunTestOptions = {},
): TestCaseRunDescriptor {
  return new TestCaseRunDescriptor(name, options);
}

// first one of each must be the most compatible one
const PASS_MARKS = ['√', '✓'];
const FAIL_MARKS = ['×', '✕'];
const normalizeTestMark = (mark: string): string => {
  if (PASS_MARKS.includes(mark)) return PASS_MARKS[0]; // tslint:disable-line
  if (FAIL_MARKS.includes(mark)) return FAIL_MARKS[0]; // tslint:disable-line
  return '?';
};

export function sanitizeOutput(output: string): string {
  let out: string = output
    .trim()
    // removes total and estimated times
    .replace(
      /^(\s*Time\s*:\s*)[\d.]+m?s(?:(,\s*estimated\s+)[\d.]+m?s)?(\s*)$/gm,
      (_, start, estimatedPrefix, end) => {
        return `${start}XXs${end}`;
      },
    )
    // removes each test time values
    .replace(
      /^(\s*)(✕|×|✓|√)(\s+[^\(]+)(\s+\([\d.]+m?s\))?$/gm,
      (_, start, mark, mid, time) => `${start}${normalizeTestMark(mark)}${mid}`,
    );
  // TODO: improves this...
  if (process.platform === 'win32') {
    out = out.replace(/\\/g, '/');
  }
  return out;
}

export function templateNameForPath(path: string): string {
  const e2eFile = join(path, '.ts-jest-e2e.json');
  if (fs.existsSync(e2eFile)) {
    return require(e2eFile).template || 'default';
  }
  return 'default';
}

export function run(
  name: string,
  { args = [], env = {}, template }: RunTestOptions = {},
): TestRunResult {
  const dir = prepareTest(
    name,
    template || templateNameForPath(join(Paths.e2eSourceDir, name)),
  );
  const pkg = require(join(dir, 'package.json'));

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
  // working directory is in the temp directory, different for each template name
  const caseDir = join(Paths.e2eWorkDir, template, name);
  const templateDir = join(Paths.e2eWorkTemplatesDir, template);

  // recreate the directory
  fs.removeSync(caseDir);
  fs.mkdirpSync(caseDir);

  const tmplModulesDir = join(templateDir, 'node_modules');
  const caseModulesDir = join(caseDir, 'node_modules');

  // link the node_modules dir if the template has one
  if (fs.existsSync(tmplModulesDir)) {
    fs.symlinkSync(tmplModulesDir, caseModulesDir);
  }

  // copy files from the template to the case dir
  fs.readdirSync(templateDir).forEach(item => {
    if (TEMPLATE_EXCLUDED_ITEMS.includes(item)) {
      return;
    }
    fs.copySync(join(templateDir, item), join(caseDir, item));
  });

  // copy source and test files
  fs.copySync(sourceDir, caseDir);

  // create a package.json if it does not exists, and/or enforce the package name
  const pkgFile = join(caseDir, 'package.json');
  const pkg: any = fs.existsSync(pkgFile) ? fs.readJsonSync(pkgFile) : {};
  pkg.name = name;
  pkg.private = true;
  pkg.version = `0.0.0-mock0`;
  fs.outputJsonSync(pkgFile, pkg, { spaces: 2 });

  return caseDir;
}
