import preset from 'ts-jest/presets/index.js'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...preset.jsWithBabelESM,
  transform: {
    '^.+\.[tj]sx?$': [
      'ts-jest',
      {
        babelConfig: true,
        isolatedModules: true,
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
