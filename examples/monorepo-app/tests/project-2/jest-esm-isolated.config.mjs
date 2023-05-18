import preset from 'ts-jest/presets/index.js'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...preset.defaultsESM,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tests/project-2/tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
