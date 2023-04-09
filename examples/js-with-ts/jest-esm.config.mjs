import preset from 'ts-jest/presets/index.js'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...preset.jsWithTsESM,
  transform: {
    '^.+\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
