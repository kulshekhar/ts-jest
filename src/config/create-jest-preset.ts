import * as TJestConfigPkg from 'jest-config'

import { rootLogger } from '../util/logger'

import { getJestConfigPkg } from './jest-config-resolver'

const logger = rootLogger.child({ namespace: 'jest-preset' })

const jestConfigPkg: typeof TJestConfigPkg = getJestConfigPkg(logger)
// jest 22 doesn't have defaults
const defaults = jestConfigPkg.defaults || {
  transform: null,
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
}

export interface TsJestPresets {
  transform: Record<string, string>
  testMatch: string[]
  moduleFileExtensions: string[]
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
    testMatch: dedup([...(from.testMatch || []), '**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)']),
    moduleFileExtensions: dedup([...(from.moduleFileExtensions || []), 'ts', 'tsx']),
  }
}

function dedup(array: string[]): string[] {
  return array.filter((e, i, a) => a.indexOf(e) === i)
}
