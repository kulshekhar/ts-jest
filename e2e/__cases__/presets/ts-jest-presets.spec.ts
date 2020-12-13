// preset and utils should work all the time
import * as presets from 'ts-jest/presets'
import { ALL_ESM_OPTIONS_ENABLED, JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from 'ts-jest/dist/constants'

test('presets', () => {
  expect(presets.defaults).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  })
  expect(presets.defaultsESM).toEqual({
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', ALL_ESM_OPTIONS_ENABLED],
    },
  })
  expect(presets.jsWithTs).toEqual({
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest',
    },
  })
  expect(presets.jsWithTsESM).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.m?[tj]sx?$': ['ts-jest', ALL_ESM_OPTIONS_ENABLED],
    },
  })
  expect(presets.jsWithBabel).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.jsx?$': 'babel-jest',
    },
  })
  expect(presets.jsWithBabelESM).toEqual({
    extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', ALL_ESM_OPTIONS_ENABLED],
      '^.+\\.m?[j]sx?$': ['babel-jest', ALL_ESM_OPTIONS_ENABLED],
    },
  })
})
