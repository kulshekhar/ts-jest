const baseCfg = require('./jest.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseCfg,
  transform: {
    ...baseCfg.transform,
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: {
          presets: ['react-app'],
        },
        isolatedModules: true,
      },
    ],
  },
}
