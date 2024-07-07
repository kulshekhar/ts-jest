const {
  createDefaultPreset,
  createDefaultEsmPreset,
  createJsWithTsPreset,
  createJsWithTsEsmPreset,
  createJsWithBabelPreset,
  createJsWithBabelEsmPreset,
  createDefaultLegacyPreset,
  createDefaultEsmLegacyPreset,
  createJsWithTsLegacyPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithBabelLegacyPreset,
  createJsWithBabelEsmLegacyPreset,
} = require('../dist/presets/create-jest-preset')

module.exports = {
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
