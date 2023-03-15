const baseEsmCfg = require('./jest-esm.config')
const baseCfg = require('./jest.config')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseEsmCfg,
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx)$': [
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
