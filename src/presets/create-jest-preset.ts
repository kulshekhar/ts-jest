import type { Config } from '@jest/types'

import { rootLogger } from '../utils/logger'

const logger = rootLogger.child({ namespace: 'jest-preset' })

export type TsJestPresets = Pick<
  Config.InitialOptions,
  'extensionsToTreatAsEsm' | 'moduleFileExtensions' | 'transform' | 'testMatch'
>

export function createJestPreset(allowJs = false, extraOptions: Config.InitialOptions = {}): TsJestPresets {
  logger.debug({ allowJs }, 'creating jest presets', allowJs ? 'handling' : 'not handling', 'JavaScript files')

  const { extensionsToTreatAsEsm, moduleFileExtensions, testMatch } = extraOptions

  return {
    ...(extensionsToTreatAsEsm ? { extensionsToTreatAsEsm } : undefined),
    ...(moduleFileExtensions ? { moduleFileExtensions } : undefined),
    transform: {
      ...extraOptions.transform,
      [allowJs ? (extensionsToTreatAsEsm?.length ? '^.+\\.m?[tj]sx?$' : '^.+\\.[tj]sx?$') : '^.+\\.tsx?$']: 'ts-jest',
    },
    ...(testMatch ? { testMatch } : undefined),
  }
}
