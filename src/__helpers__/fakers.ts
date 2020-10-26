import type { Config } from '@jest/types'
import type { Logger } from 'bs-logger'
import { resolve } from 'path'

import { ConfigSet } from '../config/config-set'
import type { TsJestGlobalOptions } from '../types'
import type { ImportReasons } from '../utils/messages'
import { TsJestCompiler } from '../compiler/ts-jest-compiler'

export function filePath(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath)
}

export const rootDir = filePath('')

function getJestConfig<T extends Config.ProjectConfig>(
  options?: Partial<Config.InitialOptions | Config.ProjectConfig>,
  tsJestOptions?: TsJestGlobalOptions,
): T {
  const res = {
    globals: {},
    ...options,
  } as any
  if (tsJestOptions) {
    res.globals['ts-jest'] = tsJestOptions
  }

  return res
}

export function importReason(text = '[[BECAUSE]]'): ImportReasons {
  return text as any
}

export const defaultResolve = (path: string): string => `resolved:${path}`

export function createConfigSet({
  jestConfig,
  tsJestConfig,
  logger, // don't change this key name, otherwise mock logging won't work
  resolve = defaultResolve,
  ...others
}: {
  jestConfig?: Partial<Config.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  logger?: Logger
  resolve?: ((path: string) => string) | null
  [key: string]: any
} = {}): ConfigSet {
  const cs = new ConfigSet(getJestConfig(jestConfig, tsJestConfig), logger)
  if (resolve) {
    cs.resolvePath = resolve
  }
  Object.keys(others).forEach((key) => {
    Object.defineProperty(cs, key, { value: others[key] })
  })

  return cs
}

// not really unit-testing here, but it's hard to mock all those values :-D
export function makeCompiler({
  jestConfig,
  tsJestConfig,
  parentConfig,
}: {
  jestConfig?: Partial<Config.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
} = {}): TsJestCompiler {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  const defaultTestRegex = ['(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.[jt]sx?$']
  const defaultTestMatch = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']
  jestConfig = {
    ...jestConfig,
    testMatch: jestConfig?.testMatch ? [...jestConfig.testMatch, ...defaultTestMatch] : defaultTestMatch,
    testRegex: jestConfig?.testRegex ? [...defaultTestRegex, ...jestConfig.testRegex] : defaultTestRegex,
  }
  const cs = createConfigSet({ jestConfig, tsJestConfig, parentConfig, resolve: null })

  return new TsJestCompiler(cs)
}
