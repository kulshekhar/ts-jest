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
// @ts-expect-error to check if we export default preset
import defaultPreset from 'ts-jest/jest-preset'
import presets from 'ts-jest/presets'

describe('presets', () => {
  it('should export default preset via jest-preset.js', () => {
    expect(defaultPreset).toEqual(createDefaultPreset())
  })

  it('should export preset creation utils', () => {
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
})
