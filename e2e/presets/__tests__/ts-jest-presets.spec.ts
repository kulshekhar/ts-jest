import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from '../../../dist/constants'
import * as presets from '../../../presets'

const defaultPreset = require('../../../jest-preset')

test('presets', () => {
  expect(defaultPreset).toEqual({
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  })

  expect(presets.defaultsESM).toEqual({
    extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
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
      '^.+\\.m?[tj]sx?$': 'ts-jest',
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
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.m?[j]sx?$': 'babel-jest',
    },
  })
})
