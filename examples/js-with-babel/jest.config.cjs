const { createJsWithBabelPreset } = require('ts-jest')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'js-with-babel',
  ...createJsWithBabelPreset({
    babelConfig: true,
  })
}
