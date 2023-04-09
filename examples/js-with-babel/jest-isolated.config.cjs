const preset = require('ts-jest/presets')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...preset.jsWithBabel,
  transform: {
    '^.+\.[tj]sx?$': [
      'ts-jest',
      {
        babelConfig: true,
        isolatedModules: true,
      },
    ],
  },
}
