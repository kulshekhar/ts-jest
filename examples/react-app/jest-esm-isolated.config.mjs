import baseEsmCfg from './jest-esm.config.mjs'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...baseEsmCfg,
  transform: {
    ...baseEsmCfg.transform,
    '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tsconfig-esm.spec.json',
        useESM: true,
      },
    ],
  },
}
