import baseCfg from './jest.config.cjs'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...baseCfg,
  preset: 'ts-jest/presets/js-with-babel-esm',
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig-esm.spec.json',
        useESM: true,
      },
    ],
  },
}
