import type { Config } from '@jest/types'

import type { TsJestGlobalOptions } from '../../../src/types'

import type RunResult from './run-result'

export interface RunTestOptions {
  template?: string
  env?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: (() => any) | string
  writeIo?: boolean
  jestConfig?: Config.InitialOptions
  tsJestConfig?: TsJestGlobalOptions
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
