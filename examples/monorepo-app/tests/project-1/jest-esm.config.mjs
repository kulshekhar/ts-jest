import preset from 'ts-jest/presets/index.js'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...preset.defaultsESM,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tests/project-1/tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
