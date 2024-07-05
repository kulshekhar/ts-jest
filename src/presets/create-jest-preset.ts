import type { Config } from '@jest/types'

import {
  TS_EXT_TO_TREAT_AS_ESM,
  JS_EXT_TO_TREAT_AS_ESM,
  TS_TRANSFORM_PATTERN,
  TS_JS_TRANSFORM_PATTERN,
  JS_TRANSFORM_PATTERN,
  ESM_TS_TRANSFORM_PATTERN,
  ESM_TS_JS_TRANSFORM_PATTERN,
  ESM_JS_TRANSFORM_PATTERN,
} from '../constants'
import type {
  DefaultPreset,
  JsWithBabelPreset,
  JsWithTsPreset,
  TsJestPresets,
  TsJestTransformerOptions,
} from '../types'
import { rootLogger } from '../utils'

const logger = rootLogger.child({ namespace: 'jest-preset' })

/**
 * @deprecated use other functions below instead
 */
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

export function createDefaultPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM' | 'babelConfig'> = {},
): DefaultPreset {
  logger.debug('creating default CJS Jest preset')

  return {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createJsWithTsPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM' | 'babelConfig'> = {},
): JsWithTsPreset {
  logger.debug('creating Js with Ts CJS Jest preset')

  return {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createJsWithBabelPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {},
): JsWithBabelPreset {
  logger.debug('creating JS with Babel CJS Jest preset')

  return {
    transform: {
      [JS_TRANSFORM_PATTERN]: 'babel-jest',
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createDefaultEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating default ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_TS_TRANSFORM_PATTERN]: [
        'ts-jest',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}

export function createJsWithTsEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating Js with Ts ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_TS_JS_TRANSFORM_PATTERN]: [
        'ts-jest',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}

export function createJsWithBabelEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_JS_TRANSFORM_PATTERN]: 'babel-jest'
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating JS with Babel ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_JS_TRANSFORM_PATTERN]: 'babel-jest',
      [ESM_TS_TRANSFORM_PATTERN]: [
        'ts-jest',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}
