const { createJsWithTsPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'js-with-ts',
  ...createJsWithTsPreset({
    tsconfig: 'tsconfig-isolated.json',
  }),
}
