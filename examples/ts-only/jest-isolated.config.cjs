const { createDefaultPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'ts-only',
  ...createDefaultPreset({
    tsconfig: 'tsconfig-isolated.json',
  }),
}
