const baseEsmCfg = require('./jest-esm.config')
const baseCfg = require('./jest.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseEsmCfg,
  transform: {
    ...baseCfg.transform,
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: {
          presets: ['react-app'],
        },
        isolatedModules: true,
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
