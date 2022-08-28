/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
