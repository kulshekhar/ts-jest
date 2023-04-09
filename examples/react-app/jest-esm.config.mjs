import baseCfg from './jest.config.cjs'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...baseCfg,
  preset: 'ts-jest/presets/js-with-babel-esm',
  transform: {
    ...baseCfg.transform,
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        babelConfig: {
          presets: ['react-app'],
        },
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
