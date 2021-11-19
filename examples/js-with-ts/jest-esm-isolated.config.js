/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
