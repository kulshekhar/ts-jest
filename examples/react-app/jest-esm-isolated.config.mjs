import baseEsmCfg from './jest-esm.config.mjs'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...baseEsmCfg,
  transform: {
    ...baseEsmCfg.transform,
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
