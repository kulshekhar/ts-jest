const { pathsToModuleNameMapper } = require('../dist/config/paths-to-module-name-mapper')
const { createJestPreset } = require('../dist/presets/create-jest-preset')

module.exports = {
  get createJestPreset() {
    console.warn('ts-jest[main] (WARN) Replace any occurrences of "ts-jest/utils" with just "ts-jest".')

    return createJestPreset
  },
  get pathsToModuleNameMapper() {
    console.warn('ts-jest[main] (WARN) Replace any occurrences of "ts-jest/utils" with just "ts-jest".')

    return pathsToModuleNameMapper
  },
}
