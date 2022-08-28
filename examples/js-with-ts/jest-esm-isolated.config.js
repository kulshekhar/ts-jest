/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
