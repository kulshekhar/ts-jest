import { createJestPreset } from './create-jest-preset'
import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from '../constants'

describe('create-jest-preset', () => {
  const baseExtraOptions = {
    testMatch: ['foo'],
    moduleFileExtensions: ['bar'],
    transform: { foo: 'bar' },
  }

  test.each([
    {
      allowJs: undefined,
      extraOptions: undefined,
    },
    {
      allowJs: false,
      extraOptions: undefined,
    },
    {
      allowJs: true,
      extraOptions: undefined,
    },
    {
      allowJs: true,
      extraOptions: {},
    },
    {
      allowJs: false,
      extraOptions: {},
    },
    {
      allowJs: false,
      extraOptions: baseExtraOptions,
    },
    {
      allowJs: true,
      extraOptions: {
        ...baseExtraOptions,
        extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
      },
    },
  ])('should return correct preset', (data) => {
    expect(createJestPreset(data.allowJs, data.extraOptions)).toMatchSnapshot()
  })
})
