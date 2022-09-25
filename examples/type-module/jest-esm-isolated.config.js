/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}

export default jestConfig
