import * as jestConfig from 'jest-config'

import { CreateJestPresetOptions, TsJestPresets } from '../types'
import { rootLogger } from '../util/logger'

const logger = rootLogger.child({ namespace: 'jest-preset' })

// jest 22 doesn't have defaults
const defaults = jestConfig.defaults || {
  transform: null,
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
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
