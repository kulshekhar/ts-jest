import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from '../constants'

import { createJestPreset } from './create-jest-preset'

describe('create-jest-preset', () => {
  const baseExtraOptions = {
    testMatch: ['foo'],
    moduleFileExtensions: ['bar'],
    transform: { foo: 'bar' },
  }

  test.each([
    {
      legacy: true,
      allowJs: undefined,
      extraOptions: undefined,
    },
    {
      legacy: false,
      allowJs: false,
      extraOptions: undefined,
    },
    {
      legacy: true,
      allowJs: true,
      extraOptions: undefined,
    },
    {
      legacy: false,
      allowJs: true,
      extraOptions: {},
    },
    {
      legacy: true,
      allowJs: false,
      extraOptions: {},
    },
    {
      legacy: false,
      allowJs: false,
      extraOptions: baseExtraOptions,
    },
    {
      legacy: true,
      allowJs: true,
      extraOptions: {
        ...baseExtraOptions,
        extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
      },
    },
  ])('should return correct preset', (data) => {
    expect(createJestPreset(data.legacy, data.allowJs, data.extraOptions)).toMatchSnapshot()
  })
})
