const baseCfg = require('./jest.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseCfg,
  preset: 'ts-jest/presets/js-with-babel-esm',
  globals: {
    'ts-jest': {
      ...baseCfg.globals['ts-jest'],
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
