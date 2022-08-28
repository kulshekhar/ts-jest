const baseCfg = require('./jest.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseCfg,
  preset: 'ts-jest/presets/js-with-babel-esm',
  transform: {
    ...baseCfg.transform,
    '^.+\\.tsx?$': [
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
