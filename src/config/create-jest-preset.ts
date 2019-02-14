import * as TJestConfigPkg from 'jest-config'

import { rootLogger } from '../util/logger'

import { getJestConfigPkg } from './jest-config-resolver'

const logger = rootLogger.child({ namespace: 'jest-preset' })

const jestConfigPkg: typeof TJestConfigPkg = getJestConfigPkg(logger)

const defaults = jestConfigPkg.defaults

export interface TsJestPresets {
  transform: Record<string, string>
  testMatch: string[] | undefined
  moduleFileExtensions: string[] | undefined
}

export interface CreateJestPresetOptions {
  allowJs?: boolean
}

export function createJestPreset(
  { allowJs = false }: CreateJestPresetOptions = {},
  from?: jest.InitialOptions,
): TsJestPresets {
  logger.debug({ allowJs }, 'creating jest presets', allowJs ? 'handling' : 'not handling', 'JavaScript files')
  from = { ...defaults, ...from }
  return {
    transform: {
      ...from.transform,
      [allowJs ? '^.+\\.[tj]sx?$' : '^.+\\.tsx?$']: 'ts-jest',
    },
    testMatch: from.testMatch || undefined,
    moduleFileExtensions: from.moduleFileExtensions || undefined,
  }
}
