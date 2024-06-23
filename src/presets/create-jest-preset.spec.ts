import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from '../constants'

import {
  createJestPreset,
  createLegacyDefaultPreset,
  createLegacyWithBabelPreset,
  createLegacyJsWithTsPreset,
  createLegacyDefaultEsmPreset,
  createLegacyJsWithTsEsmPreset,
  createLegacyWithBabelEsmPreset,
} from './create-jest-preset'

describe('create-jest-preset', () => {
  describe('createJestPreset', () => {
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

  describe('CJS presets', () => {
    describe('createLegacyDefaultPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyDefaultPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createLegacyJsWithTsPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyJsWithTsPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createLegacyWithBabelPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyWithBabelPreset({
            tsconfig: 'tsconfig.spec.json',
            babelConfig: {
              babelrc: true,
            },
          }),
        ).toMatchSnapshot()
      })
    })
  })

  describe('ESM presets', () => {
    describe('createLegacyDefaultEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyDefaultEsmPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createLegacyJsWithTsEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyJsWithTsEsmPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createLegacyJsWithBabelEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createLegacyWithBabelEsmPreset({
            tsconfig: 'tsconfig.spec.json',
            babelConfig: {
              babelrc: true,
            },
          }),
        ).toMatchSnapshot()
      })
    })
  })
})
