import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from 'ts-jest'
import presets from 'ts-jest/presets'

const defaultPreset = require('ts-jest/jest-preset')

test('presets', () => {
  expect(defaultPreset).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  })
  expect(presets.defaultsLegacy).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest/legacy',
    },
  })
  expect(presets.defaultsESM).toEqual({
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  })
  expect(presets.defaultsESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': 'ts-jest/legacy',
    },
  })
  expect(presets.jsWithTs).toEqual({
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest',
    },
  })
  expect(presets.jsWithTsLegacy).toEqual({
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest/legacy',
    },
  })
  expect(presets.jsWithTsESM).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.m?[tj]sx?$': 'ts-jest',
    },
  })
  expect(presets.jsWithTsESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.m?[tj]sx?$': 'ts-jest/legacy',
    },
  })
  expect(presets.jsWithBabel).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.jsx?$': 'babel-jest',
    },
  })
  expect(presets.jsWithBabelLegacy).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest/legacy',
      '^.+\\.jsx?$': 'babel-jest',
    },
  })
  expect(presets.jsWithBabelESM).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.m?[j]sx?$': 'babel-jest',
    },
  })
  expect(presets.jsWithBabelESMLegacy).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': 'ts-jest/legacy',
      '^.+\\.m?[j]sx?$': 'babel-jest',
    },
  })
})
