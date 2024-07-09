const { createJsWithTsPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...createJsWithTsPreset({
    isolatedModules: true,
  })
}
