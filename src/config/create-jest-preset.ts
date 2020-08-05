import type { Config } from '@jest/types'

import { rootLogger } from '../util/logger'

const logger = rootLogger.child({ namespace: 'jest-preset' })

export type TsJestPresets = Pick<Config.InitialOptions, 'moduleFileExtensions' | 'transform' | 'testMatch'>

export interface CreateJestPresetOptions {
  allowJs?: boolean
}

export function createJestPreset(
  { allowJs = false }: CreateJestPresetOptions = {},
  from: Config.InitialOptions = {},
): TsJestPresets {
  logger.debug({ allowJs }, 'creating jest presets', allowJs ? 'handling' : 'not handling', 'JavaScript files')

  return {
    transform: {
      ...from.transform,
      [allowJs ? '^.+\\.[tj]sx?$' : '^.+\\.tsx?$']: 'ts-jest',
    },
    ...(from.testMatch ? { testMatch: from.testMatch } : undefined),
    ...(from.moduleFileExtensions ? { moduleFileExtensions: from.moduleFileExtensions } : undefined),
  }
}
