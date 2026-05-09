import type { Config } from '@jest/types'

import {
  TS_EXT_TO_TREAT_AS_ESM,
  JS_EXT_TO_TREAT_AS_ESM,
  MJS_NODE_MODULES_TRANSFORM_PATTERN,
  TS_TRANSFORM_PATTERN,
  TS_JS_TRANSFORM_PATTERN,
  JS_TRANSFORM_PATTERN,
  ESM_TS_TRANSFORM_PATTERN,
  ESM_TS_JS_TRANSFORM_PATTERN,
  ESM_JS_TRANSFORM_PATTERN,
} from '../constants'
import {
  DefaultEsmLegacyPreset,
  DefaultEsmPreset,
  DefaultEsmTransformOptions,
  DefaultLegacyPreset,
  DefaultPreset,
  DefaultTransformOptions,
  JsWithBabelEsmLegacyPreset,
  JsWithBabelEsmPreset,
  JsWithBabelEsmTransformOptions,
  JsWithBabelLegacyPreset,
  JsWithBabelPreset,
  JsWithBabelTransformerOptions,
  JsWithTsEsmLegacyPreset,
  JsWithTsEsmPreset,
  JsWithTsEsmTransformOptions,
  JsWithTsLegacyPreset,
  JsWithTsPreset,
  JsWithTsTransformOptions,
  NodeModulesTransformOptions,
  TsJestPresets,
  TsJestTransformerOptions,
} from '../types'
import { rootLogger, nodeModulesTransformPattern } from '../utils'

const logger = rootLogger.child({ namespace: 'jest-preset' })

function withNodeModulesTransform<T extends { transform: Record<string, unknown> }>(
  preset: T,
  transformer: 'ts-jest' | 'ts-jest/legacy',
  options: object,
  { mjsPackages = false, packageNames }: NodeModulesTransformOptions,
): T {
  if (!mjsPackages && !packageNames?.length) return preset

  return {
    ...preset,
    transformIgnorePatterns: [nodeModulesTransformPattern({ mjsPackages, packageNames })],
    transform: {
      ...preset.transform,
      ...(mjsPackages ? { [MJS_NODE_MODULES_TRANSFORM_PATTERN]: [transformer, options] } : {}),
    },
  } as T
}

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
  tsJestTransformOptions: DefaultTransformOptions = {},
  nodeModulesTransformOptions: NodeModulesTransformOptions = {},
): DefaultPreset {
  logger.debug('creating default CJS Jest preset')

  const preset: DefaultPreset = {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }

  return withNodeModulesTransform(preset, 'ts-jest', tsJestTransformOptions, nodeModulesTransformOptions)
}

export function createDefaultLegacyPreset(
  tsJestTransformOptions: DefaultTransformOptions = {},
  nodeModulesTransformOptions: NodeModulesTransformOptions = {},
): DefaultLegacyPreset {
  logger.debug('creating default CJS Jest preset')

  const preset: DefaultLegacyPreset = {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', tsJestTransformOptions],
    },
  }

  return withNodeModulesTransform(preset, 'ts-jest/legacy', tsJestTransformOptions, nodeModulesTransformOptions)
}

export function createJsWithTsPreset(
  tsJestTransformOptions: JsWithTsTransformOptions = {},
  nodeModulesTransformOptions: NodeModulesTransformOptions = {},
): JsWithTsPreset {
  logger.debug('creating Js with Ts CJS Jest preset')

  const preset: JsWithTsPreset = {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }

  return withNodeModulesTransform(preset, 'ts-jest', tsJestTransformOptions, nodeModulesTransformOptions)
}

export function createJsWithTsLegacyPreset(
  tsJestTransformOptions: JsWithTsTransformOptions = {},
  nodeModulesTransformOptions: NodeModulesTransformOptions = {},
): JsWithTsLegacyPreset {
  logger.debug('creating Js with Ts CJS Jest preset')

  const preset: JsWithTsLegacyPreset = {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest/legacy', tsJestTransformOptions],
    },
  }

  return withNodeModulesTransform(preset, 'ts-jest/legacy', tsJestTransformOptions, nodeModulesTransformOptions)
}

export function createJsWithBabelPreset(tsJestTransformOptions: JsWithBabelTransformerOptions = {}): JsWithBabelPreset {
  logger.debug('creating JS with Babel CJS Jest preset')

  return {
    transform: {
      [JS_TRANSFORM_PATTERN]: 'babel-jest',
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createJsWithBabelLegacyPreset(
  tsJestTransformOptions: JsWithBabelTransformerOptions = {},
): JsWithBabelLegacyPreset {
  logger.debug('creating JS with Babel CJS Jest preset')

  return {
    transform: {
      [JS_TRANSFORM_PATTERN]: 'babel-jest',
      [TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', tsJestTransformOptions],
    },
  }
}

export function createDefaultEsmPreset(tsJestTransformOptions: DefaultEsmTransformOptions = {}): DefaultEsmPreset {
  logger.debug('creating default ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
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

export function createDefaultEsmLegacyPreset(
  tsJestTransformOptions: DefaultEsmTransformOptions = {},
): DefaultEsmLegacyPreset {
  logger.debug('creating default ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_TS_TRANSFORM_PATTERN]: [
        'ts-jest/legacy',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}

export function createJsWithTsEsmPreset(tsJestTransformOptions: JsWithTsEsmTransformOptions = {}): JsWithTsEsmPreset {
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

export function createJsWithTsEsmLegacyPreset(
  tsJestTransformOptions: JsWithTsEsmTransformOptions = {},
): JsWithTsEsmLegacyPreset {
  logger.debug('creating Js with Ts ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_TS_JS_TRANSFORM_PATTERN]: [
        'ts-jest/legacy',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}

export function createJsWithBabelEsmPreset(
  tsJestTransformOptions: JsWithBabelEsmTransformOptions = {},
): JsWithBabelEsmPreset {
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

export function createJsWithBabelEsmLegacyPreset(
  tsJestTransformOptions: JsWithBabelEsmTransformOptions = {},
): JsWithBabelEsmLegacyPreset {
  logger.debug('creating JS with Babel ESM Jest preset')

  return {
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      [ESM_JS_TRANSFORM_PATTERN]: 'babel-jest',
      [ESM_TS_TRANSFORM_PATTERN]: [
        'ts-jest/legacy',
        {
          ...tsJestTransformOptions,
          useESM: true,
        },
      ],
    },
  }
}
