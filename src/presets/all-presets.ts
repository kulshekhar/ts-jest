import {
  createDefaultEsmLegacyPreset,
  createDefaultEsmPreset,
  createDefaultLegacyPreset,
  createDefaultPreset,
  createJsWithBabelEsmLegacyPreset,
  createJsWithBabelEsmPreset,
  createJsWithBabelLegacyPreset,
  createJsWithBabelPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithTsEsmPreset,
  createJsWithTsLegacyPreset,
  createJsWithTsPreset,
} from './create-jest-preset'

const allPresets = {
  get defaults() {
    return createDefaultPreset()
  },
  get defaultsLegacy() {
    return createDefaultLegacyPreset()
  },
  get defaultsESM() {
    return createDefaultEsmPreset()
  },
  get defaultsESMLegacy() {
    return createDefaultEsmLegacyPreset()
  },
  get jsWithTs() {
    return createJsWithTsPreset()
  },
  get jsWithTsLegacy() {
    return createJsWithTsLegacyPreset()
  },
  get jsWithTsESM() {
    return createJsWithTsEsmPreset()
  },
  get jsWithTsESMLegacy() {
    return createJsWithTsEsmLegacyPreset()
  },
  get jsWithBabel() {
    return createJsWithBabelPreset()
  },
  get jsWithBabelLegacy() {
    return createJsWithBabelLegacyPreset()
  },
  get jsWithBabelESM() {
    return createJsWithBabelEsmPreset()
  },
  get jsWithBabelESMLegacy() {
    return createJsWithBabelEsmLegacyPreset()
  },
}

export default allPresets
