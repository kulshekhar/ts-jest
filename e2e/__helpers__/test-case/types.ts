import { TsJestConfig } from '../../../src/types'
import RunResult from './run-result'

export interface RunTestOptions {
  template?: string
  env?: {}
  args?: string[]
  inject?: (() => any) | string
  writeIo?: boolean
  jestConfig?: jest.ProjectConfig | any
  tsJestConfig?: TsJestConfig | any
}

export type RunWithTemplatesIterator = (
  runtTest: () => RunResult,
  context: RunWithTemplateIteratorContext,
) => void

export interface RunWithTemplateIteratorContext {
  templateName: string
  describeLabel: string
  itLabel: string
  testLabel: string
}

// tslint:disable-next-line:interface-over-type-literal
export type TestRunResultsMap<T extends string = string> = {
  [key in T]: RunResult
}

export interface PreparedTest {
  workdir: string
  templateDir: string
  sourceDir: string
  ioDir: string
  hooksFile: string
}
