const { createJestPreset } = require('../dist/presets/create-jest-preset')

module.exports = {
  get defaults() {
    return createJestPreset()
  },
  get jsWithTs() {
    return createJestPreset({ allowJs: true })
  },
  get jsWithBabel() {
    return createJestPreset(
      { allowJs: false },
      {
        transform: {
          '^.+\\.jsx?$': 'babel-jest',
        },
      }
    )
  },
}
