const baseCfg = require('./jest.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseCfg,
  globals: {
    'ts-jest': {
      ...baseCfg.globals['ts-jest'],
      isolatedModules: true,
    },
  },
}
