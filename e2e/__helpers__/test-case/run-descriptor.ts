import { join } from 'path'

import * as Paths from '../../../scripts/lib/paths'

import RunResult from './run-result'
import { run } from './runtime'
import { RunTestOptions, RunWithTemplateIteratorContext, RunWithTemplatesIterator, TestRunResultsMap } from './types'

// tslint:disable-next-line:no-default-export
export default class RunDescriptor {
  protected _options: RunTestOptions
  protected _sourcePackageJson: any

  constructor(readonly name: string, options: RunTestOptions = {}) {
    this._options = { ...options }
  }

  get sourceDir() {
    return join(Paths.e2eSourceDir, this.name)
  }
  get templateWorkdir() {
    return join(Paths.e2eWorkTemplatesDir, this.name)
  }
  get workdir() {
    return join(Paths.e2eWorkDir, this.templateName, this.name)
  }

  get sourcePackageJson() {
    return this._sourcePackageJson || (this._sourcePackageJson = require(join(this.sourceDir, 'package.json')))
  }

  get templateName(): string {
    if (!this._options.template) {
      // read the template from the package field if it is not given
      this._options.template = this.sourcePackageJson.e2eTemplate || 'default'
    }
    return this._options.template as string
  }

  run(logUnlessStatus?: number): RunResult {
    const result = run(this.name, {
      ...this._options,
      template: this.templateName,
    })
    if (logUnlessStatus != null && logUnlessStatus !== result.status) {
      // tslint:disable-next-line:no-console
      console.log(
        `Output of test run in "${this.name}" using template "${this.templateName}" (exit code: ${result.status}):\n\n`,
        result.output.trim(),
      )
    }
    return result
  }

  runWithTemplates<T extends string>(
    templates: T[],
    expectedStatus?: number,
    iterator?: RunWithTemplatesIterator,
  ): TestRunResultsMap<T> {
    if (templates.length < 1) {
      throw new RangeError(`There must be at least one template to run the test case with.`)
    }

    if (!templates.every((t, i) => templates.indexOf(t, i + 1) === -1)) {
      throw new Error(`Each template must be unique. Given ${templates.join(', ')}`)
    }
    return templates.reduce(
      (map, template) => {
        const desc = new RunDescriptor(this.name, {
          ...this._options,
          template,
        })
        const runTest = () => {
          return (map[template] = desc.run(expectedStatus))
        }
        if (iterator) {
          iterator(runTest, createIteratorContext(template, expectedStatus))
        } else {
          runTest()
        }
        return map
      },
      {} as TestRunResultsMap<T>,
    )
  }
}

function createIteratorContext(templateName: string, expectedStatus?: number): RunWithTemplateIteratorContext {
  const actionForExpectedStatus = (status?: number): string => {
    if (status == null) {
      return 'run'
    }
    return status === 0 ? 'pass' : 'fail'
  }
  return {
    templateName,
    describeLabel: `with template "${templateName}"`,
    itLabel: `should ${actionForExpectedStatus(expectedStatus)}`,
    testLabel: `should ${actionForExpectedStatus(expectedStatus)} using template "${templateName}"`,
  }
}
