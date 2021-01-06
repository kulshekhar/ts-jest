const { pathsToModuleNameMapper } = require('../dist/config/paths-to-module-name-mapper')
const { createJestPreset } = require('../dist/presets/create-jest-preset')
const { mocked } = require('../dist/utils/testing')

module.exports = {
  get mocked() {
    return mocked
  },
  get createJestPreset() {
    return createJestPreset
  },
  get pathsToModuleNameMapper() {
    return pathsToModuleNameMapper
  },
}
