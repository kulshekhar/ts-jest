const baseCfg = require('./jest.config')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseCfg,
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx)$': [
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
