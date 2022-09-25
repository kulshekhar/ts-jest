import type { Config } from '@jest/types'

import type { TsJestPresets, TsJestTransformerOptions } from '../types'
import { rootLogger } from '../utils'

const logger = rootLogger.child({ namespace: 'jest-preset' })

export function createJestPreset(
  legacy = false,
  allowJs = false,
  extraOptions: Config.InitialOptions = {},
): TsJestPresets {
  logger.debug({ allowJs }, 'creating jest presets', allowJs ? 'handling' : 'not handling', 'JavaScript files')

  const { extensionsToTreatAsEsm, moduleFileExtensions, testMatch } = extraOptions
  const supportESM = extensionsToTreatAsEsm?.length
  const tsJestTransformOptions: TsJestTransformerOptions = supportESM ? { useESM: true } : {}

  return {
    ...(extensionsToTreatAsEsm ? { extensionsToTreatAsEsm } : undefined),
    ...(moduleFileExtensions ? { moduleFileExtensions } : undefined),
    ...(testMatch ? { testMatch } : undefined),
    transform: {
      ...extraOptions.transform,
      [allowJs ? (supportESM ? '^.+\\.m?[tj]sx?$' : '^.+\\.[tj]sx?$') : '^.+\\.tsx?$']: legacy
        ? ['ts-jest/legacy', tsJestTransformOptions]
        : ['ts-jest', tsJestTransformOptions],
    },
  }
}
