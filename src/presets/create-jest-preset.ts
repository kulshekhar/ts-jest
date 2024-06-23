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
  BabelConfig,
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

export function createLegacyDefaultPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM' | 'babelConfig'> = {},
): DefaultPreset {
  logger.debug('creating default legacy CJS Jest preset')

  return {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createLegacyJsWithTsPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM' | 'babelConfig'> = {},
): JsWithTsPreset {
  logger.debug('creating legacy Js with Ts CJS Jest preset')

  return {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createLegacyWithBabelPreset(
  tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {},
): JsWithBabelPreset {
  logger.debug('creating legacy JS with Babel CJS Jest preset')

  const babelConfig = tsJestTransformOptions.babelConfig

  return {
    transform: {
      [JS_TRANSFORM_PATTERN]: ['babel-jest', typeof babelConfig === 'object' ? babelConfig : {}],
      [TS_TRANSFORM_PATTERN]: [
        'ts-jest',
        {
          ...tsJestTransformOptions,
          babelConfig: true,
        },
      ],
    },
  }
}

export function createLegacyDefaultEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating default legacy ESM Jest preset')

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

export function createLegacyJsWithTsEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating Js with Ts legacy ESM Jest preset')

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

export function createLegacyWithBabelEsmPreset(tsJestTransformOptions: Omit<TsJestTransformerOptions, 'useESM'> = {}): {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_JS_TRANSFORM_PATTERN]: ['babel-jest', babelConfig: BabelConfig]
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & typeof tsJestTransformOptions]
  }
} {
  logger.debug('creating JS with Babel legacy ESM Jest preset')

  const babelConfig = tsJestTransformOptions.babelConfig

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_JS_TRANSFORM_PATTERN]: ['babel-jest', typeof babelConfig === 'object' ? babelConfig : {}],
      [ESM_TS_TRANSFORM_PATTERN]: [
        'ts-jest',
        {
          ...tsJestTransformOptions,
          useESM: true,
          babelConfig,
        },
      ],
    },
  }
}
