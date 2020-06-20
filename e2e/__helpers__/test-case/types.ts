import { Config } from '@jest/types'

import { TsJestConfig } from '../../../src/types'

import RunResult from './run-result'

export interface RunTestOptions {
  template?: string
  env?: Record<string, unknown>
  inject?: (() => any) | string
  writeIo?: boolean
  jestConfig?: Config.ProjectConfig | any
  tsJestConfig?: Partial<TsJestConfig> | any
  noCache?: boolean
  jestConfigPath?: string
}

export type RunWithTemplatesIterator = (runtTest: () => RunResult, context: RunWithTemplateIteratorContext) => void

export interface RunWithTemplateIteratorContext {
  templateName: string
  describeLabel: string
  itLabel: string
  testLabel: string
}

export type TestRunResultsMap<T extends string = string> = { [key in T]: RunResult }

export interface PreparedTest {
  workdir: string
  templateDir: string
  sourceDir: string
}
