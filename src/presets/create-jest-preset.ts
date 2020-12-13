import type { Config } from '@jest/types'

import { ALL_ESM_OPTIONS_ENABLED } from '../constants'

import { rootLogger } from '../utils/logger'

const logger = rootLogger.child({ namespace: 'jest-preset' })

export type TsJestPresets = Pick<
  Config.InitialOptions,
  'extensionsToTreatAsEsm' | 'moduleFileExtensions' | 'transform' | 'testMatch'
>

export function createJestPreset(allowJs = false, extraOptions: Config.InitialOptions = {}): TsJestPresets {
  logger.debug({ allowJs }, 'creating jest presets', allowJs ? 'handling' : 'not handling', 'JavaScript files')

  const { extensionsToTreatAsEsm, moduleFileExtensions, testMatch } = extraOptions
  const supportESM = extensionsToTreatAsEsm?.length

  return {
    ...(extensionsToTreatAsEsm ? { extensionsToTreatAsEsm } : undefined),
    ...(moduleFileExtensions ? { moduleFileExtensions } : undefined),
    ...(testMatch ? { testMatch } : undefined),
    transform: {
      ...extraOptions.transform,
      [allowJs ? (supportESM ? '^.+\\.m?[tj]sx?$' : '^.+\\.[tj]sx?$') : '^.+\\.tsx?$']: supportESM
        ? ['ts-jest', ALL_ESM_OPTIONS_ENABLED]
        : 'ts-jest',
    },
  }
}
