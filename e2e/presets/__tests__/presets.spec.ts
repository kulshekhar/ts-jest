import {
  JS_EXT_TO_TREAT_AS_ESM,
  TS_EXT_TO_TREAT_AS_ESM,
  createDefaultPreset,
  createDefaultEsmPreset,
  createJsWithTsPreset,
  createJsWithTsEsmPreset,
  createJsWithBabelPreset,
  createJsWithBabelEsmPreset,
} from 'ts-jest'
// @ts-expect-error we have this file but we don't have type definition for it
import defaultPreset from 'ts-jest/jest-preset'
import presets from 'ts-jest/presets'

import extendedJestConfig from '../extended-jest-config'

test('presets', () => {
  expect(defaultPreset).toEqual(createDefaultPreset())
  expect(presets.defaultsLegacy).toEqual({
    transform: {
      '^.+\\.tsx?$': ['ts-jest/legacy', {}],
    },
  })
  expect(presets.defaultsESM).toEqual(createDefaultEsmPreset())
  expect(presets.defaultsESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': ['ts-jest/legacy', { useESM: true }],
    },
  })
  expect(presets.jsWithTs).toEqual(createJsWithTsPreset())
  expect(presets.jsWithTsLegacy).toEqual({
    transform: {
      '^.+\\.[tj]sx?$': ['ts-jest/legacy', {}],
    },
  })
  expect(presets.jsWithTsESM).toEqual(createJsWithTsEsmPreset())
  expect(presets.jsWithTsESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.m?[tj]sx?$': ['ts-jest/legacy', { useESM: true }],
    },
  })
  expect(presets.jsWithBabel).toEqual(createJsWithBabelPreset())
  expect(presets.jsWithBabelLegacy).toEqual({
    transform: {
      '^.+\\.tsx?$': ['ts-jest/legacy', {}],
      '^.+\\.jsx?$': 'babel-jest',
    },
  })
  expect(presets.jsWithBabelESM).toEqual(createJsWithBabelEsmPreset())
  expect(presets.jsWithBabelESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': ['ts-jest/legacy', { useESM: true }],
      '^.+\\.m?[j]sx?$': 'babel-jest',
    },
  })
})

test('should allow extending jest config without type issues when using create preset util functions', () => {
  expect(extendedJestConfig).toBeTruthy()
})
