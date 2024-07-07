import {
  createDefaultPreset,
  createDefaultLegacyPreset,
  createDefaultEsmPreset,
  createDefaultEsmLegacyPreset,
  createJsWithTsPreset,
  createJsWithTsLegacyPreset,
  createJsWithTsEsmPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithBabelPreset,
  createJsWithBabelLegacyPreset,
  createJsWithBabelEsmPreset,
  createJsWithBabelEsmLegacyPreset,
} from 'ts-jest'
// @ts-expect-error we have this file but we don't have type definition for it
import defaultPreset from 'ts-jest/jest-preset'
import presets from 'ts-jest/presets'

import extendedJestConfig from '../extended-jest-config'

test('presets', () => {
  expect(defaultPreset).toEqual(createDefaultPreset())
  expect(presets.defaultsLegacy).toEqual(createDefaultLegacyPreset())
  expect(presets.defaultsESM).toEqual(createDefaultEsmPreset())
  expect(presets.defaultsESMLegacy).toEqual(createDefaultEsmLegacyPreset())
  expect(presets.jsWithTs).toEqual(createJsWithTsPreset())
  expect(presets.jsWithTsLegacy).toEqual(createJsWithTsLegacyPreset())
  expect(presets.jsWithTsESM).toEqual(createJsWithTsEsmPreset())
  expect(presets.jsWithTsESMLegacy).toEqual(createJsWithTsEsmLegacyPreset())
  expect(presets.jsWithBabel).toEqual(createJsWithBabelPreset())
  expect(presets.jsWithBabelLegacy).toEqual(createJsWithBabelLegacyPreset())
  expect(presets.jsWithBabelESM).toEqual(createJsWithBabelEsmPreset())
  expect(presets.jsWithBabelESMLegacy).toEqual(createJsWithBabelEsmLegacyPreset())
})

test('should allow extending jest config without type issues when using create preset util functions', () => {
  expect(extendedJestConfig).toBeTruthy()
})
