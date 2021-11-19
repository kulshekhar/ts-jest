/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel-esm',
  globals: {
    'ts-jest': {
      babelConfig: true,
      isolatedModules: true,
      tsconfig: 'tsconfig-esm.json',
      useESM: true,
    },
  },
}
