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
} from '../types'
import { rootLogger } from '../utils'

const logger = rootLogger.child({ namespace: 'jest-preset' })

export function createDefaultPreset(tsJestTransformOptions: DefaultTransformOptions = {}): DefaultPreset {
  logger.debug('creating default CJS Jest preset')

  return {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createDefaultLegacyPreset(tsJestTransformOptions: DefaultTransformOptions = {}): DefaultLegacyPreset {
  logger.debug('creating default CJS Jest preset')

  return {
    transform: {
      [TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', tsJestTransformOptions],
    },
  }
}

export function createJsWithTsPreset(tsJestTransformOptions: JsWithTsTransformOptions = {}): JsWithTsPreset {
  logger.debug('creating Js with Ts CJS Jest preset')

  return {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest', tsJestTransformOptions],
    },
  }
}

export function createJsWithTsLegacyPreset(
  tsJestTransformOptions: JsWithTsTransformOptions = {},
): JsWithTsLegacyPreset {
  logger.debug('creating Js with Ts CJS Jest preset')

  return {
    transform: {
      [TS_JS_TRANSFORM_PATTERN]: ['ts-jest/legacy', tsJestTransformOptions],
    },
  }
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
