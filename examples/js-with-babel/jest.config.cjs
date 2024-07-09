const { createJsWithBabelPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...createJsWithBabelPreset({
    babelConfig: true,
  })
}
