/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
