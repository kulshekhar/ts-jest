const baseCfg = require('./jest.config.cjs')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...baseCfg,
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
}
