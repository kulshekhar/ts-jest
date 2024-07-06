const { JS_EXT_TO_TREAT_AS_ESM, TS_EXT_TO_TREAT_AS_ESM } = require('../dist/constants')
const {
  createJestPreset,
  createDefaultPreset,
  createDefaultEsmPreset,
  createJsWithTsPreset,
  createJsWithTsEsmPreset,
  createJsWithBabelPreset,
  createJsWithBabelEsmPreset,
} = require('../dist/presets/create-jest-preset')

module.exports = {
  get defaults() {
    return createDefaultPreset()
  },
  get defaultsLegacy() {
    return createJestPreset(true, false)
  },
  get defaultsESM() {
    return createDefaultEsmPreset()
  },
  get defaultsESMLegacy() {
    return createJestPreset(true, false, { extensionsToTreatAsEsm: TS_EXT_TO_TREAT_AS_ESM })
  },
  get jsWithTs() {
    return createJsWithTsPreset()
  },
  get jsWithTsLegacy() {
    return createJestPreset(true, true)
  },
  get jsWithTsESM() {
    return createJsWithTsEsmPreset()
  },
  get jsWithTsESMLegacy() {
    return createJestPreset(true, true, {
      extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
    })
  },
  get jsWithBabel() {
    return createJsWithBabelPreset()
  },
  get jsWithBabelLegacy() {
    return createJestPreset(true, false, {
      transform: {
        '^.+\\.jsx?$': 'babel-jest',
      },
    })
  },
  get jsWithBabelESM() {
    return createJsWithBabelEsmPreset()
  },
  get jsWithBabelESMLegacy() {
    return createJestPreset(true, false, {
      extensionsToTreatAsEsm: [...JS_EXT_TO_TREAT_AS_ESM, ...TS_EXT_TO_TREAT_AS_ESM],
      transform: {
        '^.+\\.m?[j]sx?$': 'babel-jest',
      },
    })
  },
}
