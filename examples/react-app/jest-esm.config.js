const baseCfg = require('./jest.config')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseCfg,
  preset: 'ts-jest/presets/js-with-babel-esm',
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        babelConfig: {
          presets: ['react-app'],
        },
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
