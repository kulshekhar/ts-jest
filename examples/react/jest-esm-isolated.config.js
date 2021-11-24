const baseEsmCfg = require('./jest-esm.config')

/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  ...baseEsmCfg,
  globals: {
    'ts-jest': {
      ...baseEsmCfg.globals['ts-jest'],
      isolatedModules: true,
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
