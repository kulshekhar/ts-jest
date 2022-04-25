import { resolve } from 'path'

import type { Config } from '@jest/types'
import type { Logger } from 'bs-logger'

import { TsCompiler } from '../legacy/compiler'
import { ConfigSet } from '../legacy/config/config-set'
import type { StringMap, TsJestGlobalOptions } from '../types'
import type { ImportReasons } from '../utils/messages'

export function filePath(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath)
}

export const rootDir = filePath('')

const defaultTestRegex = ['(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.[jt]sx?$']
const defaultTestMatch = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']

function getJestConfig<T extends Config.ProjectConfig>(
  options?: Partial<Config.InitialOptions | Config.ProjectConfig>,
  tsJestOptions?: TsJestGlobalOptions,
): T {
  const res = {
    globals: {},
    ...options,
  } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  if (tsJestOptions) {
    res.globals['ts-jest'] = tsJestOptions
  }

  return res
}

export function importReason(text = '[[BECAUSE]]'): ImportReasons {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
} = {}): ConfigSet {
  const jestCfg = getJestConfig(jestConfig, tsJestConfig)
  const cs = new ConfigSet(
    {
      ...jestCfg,
      testMatch: jestConfig?.testMatch ? [...jestConfig.testMatch, ...defaultTestMatch] : defaultTestMatch,
      testRegex: jestConfig?.testRegex ? [...jestConfig.testRegex, ...defaultTestRegex] : defaultTestRegex,
      extensionsToTreatAsEsm: jestCfg.extensionsToTreatAsEsm ?? [],
    },
    logger,
  )
  if (resolve) {
    cs.resolvePath = resolve
  }
  Object.keys(others).forEach((key) => {
    Object.defineProperty(cs, key, { value: others[key] })
  })

  return cs
}

// not really unit-testing here, but it's hard to mock all those values :-D
export function makeCompiler(
  {
    jestConfig,
    tsJestConfig,
    parentConfig,
  }: {
    jestConfig?: Partial<Config.ProjectConfig>
    tsJestConfig?: TsJestGlobalOptions
    parentConfig?: TsJestGlobalOptions
  } = {},
  jestCacheFS: StringMap = new Map<string, string>(),
): TsCompiler {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  jestConfig = {
    ...jestConfig,
    extensionsToTreatAsEsm: jestConfig?.extensionsToTreatAsEsm ?? [],
    testMatch: jestConfig?.testMatch ? [...jestConfig.testMatch, ...defaultTestMatch] : defaultTestMatch,
    testRegex: jestConfig?.testRegex ? [...jestConfig.testRegex, ...defaultTestRegex] : defaultTestRegex,
  }
  const cs = createConfigSet({ jestConfig, tsJestConfig, parentConfig, resolve: null })

  return new TsCompiler(cs, jestCacheFS)
}
