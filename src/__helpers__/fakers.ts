import { Config } from '@jest/types'
import { resolve } from 'path'

import { createCompiler } from '../compiler/instance'
import { ConfigSet } from '../config/config-set'
import { BabelConfig, TsJestConfig, TsJestGlobalOptions } from '../types'
import { ImportReasons } from '../util/messages'

export function filePath(relPath: string): string {
  return resolve(__dirname, '..', '..', relPath)
}

export const rootDir = filePath('')

export function tsJestConfig(options?: Partial<TsJestConfig>): TsJestConfig {
  return {
    compilerHost: false,
    emit: false,
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

export function getJestConfig<T extends Config.ProjectConfig>(
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

// not really unit-testing here, but it's hard to mock all those values :-D
export function makeCompiler({
  jestConfig,
  tsJestConfig,
  parentConfig,
}: {
  jestConfig?: Partial<Config.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
} = {}) {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  const cs = new ConfigSet(getJestConfig(jestConfig, tsJestConfig), parentConfig)

  return createCompiler(cs)
}
