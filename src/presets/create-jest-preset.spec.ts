import { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } from '../constants'

import {
  createJestPreset,
  createDefaultPreset,
  createJsWithBabelPreset,
  createJsWithTsPreset,
  createDefaultEsmPreset,
  createJsWithTsEsmPreset,
  createJsWithBabelEsmPreset,
  createJsWithTsLegacyPreset,
  createJsWithBabelLegacyPreset,
  createDefaultEsmLegacyPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithBabelEsmLegacyPreset,
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
    describe('createDefaultPreset', () => {
      it('should return preset config', () => {
        expect(
          createDefaultPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createDefaultLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createDefaultPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithTsPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithTsPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithTsLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithTsLegacyPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithBabelPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithBabelPreset({
            tsconfig: 'tsconfig.spec.json',
            babelConfig: {
              babelrc: true,
            },
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithBabelLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithBabelLegacyPreset({
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
    describe('createDefaultEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createDefaultEsmPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createDefaultEsmLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createDefaultEsmLegacyPreset({
            tsconfig: 'tsconfig.spec.json',
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithTsEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithTsEsmPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithTsEsmLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithTsEsmLegacyPreset({
            tsconfig: 'tsconfig.spec.json',
            isolatedModules: true,
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithBabelEsmPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithBabelEsmPreset({
            tsconfig: 'tsconfig.spec.json',
            babelConfig: {
              babelrc: true,
            },
          }),
        ).toMatchSnapshot()
      })
    })

    describe('createJsWithBabelEsmLegacyPreset', () => {
      it('should return preset config', () => {
        expect(
          createJsWithBabelEsmLegacyPreset({
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
