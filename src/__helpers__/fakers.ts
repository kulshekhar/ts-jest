import { Config } from '@jest/types'
import { resolve } from 'path'

import { createCompilerInstance } from '../compiler/instance'
import { ConfigSet } from '../config/config-set'
import { BabelConfig, TsCompiler, TsJestConfig, TsJestGlobalOptions } from '../types'
import { ImportReasons } from '../util/messages'

export function filePath(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath)
}

export const rootDir = filePath('')

export function tsJestConfig(options?: Partial<TsJestConfig>): TsJestConfig {
  return {
    isolatedModules: false,
    compiler: 'typescript',
    transformers: [],
    babelConfig: undefined,
    tsConfig: undefined,
    packageJson: undefined,
    stringifyContentPathRegex: undefined,
    diagnostics: { ignoreCodes: [], pretty: false, throws: true },
    ...options,
  }
}

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

export function babelConfig<T extends BabelConfig>(options?: BabelConfig): T {
  return {
    ...options,
    presets: [...(options && options.presets)],
    plugins: [...(options && options.plugins)],
  } as any
}

export function importReason(text = '[[BECAUSE]]'): ImportReasons {
  return text as any
}

export const defaultResolve = (path: string): string => `resolved:${path}`

export function createConfigSet({
  jestConfig,
  tsJestConfig,
  parentConfig,
  resolve = defaultResolve,
  ...others
}: {
  jestConfig?: Partial<Config.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
  resolve?: ((path: string) => string) | null
  [key: string]: any
} = {}): ConfigSet {
  const defaultTestRegex = ['(/__tests__/.*|(\\\\.|/)(test|spec))\\\\.[jt]sx?$']
  const defaultTestMatch = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']
  jestConfig = {
    ...jestConfig,
    testMatch: jestConfig?.testMatch ? [...jestConfig.testMatch, ...defaultTestMatch] : defaultTestMatch,
    testRegex: jestConfig?.testRegex ? [...defaultTestRegex, ...jestConfig.testRegex] : defaultTestRegex,
  }
  const cs = new ConfigSet(getJestConfig(jestConfig, tsJestConfig), parentConfig)
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
} = {}): TsCompiler {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  const cs = createConfigSet({ jestConfig, tsJestConfig, parentConfig, resolve: null })

  return createCompilerInstance(cs)
}
