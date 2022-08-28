/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel-esm',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
        tsconfig: 'tsconfig-esm.json',
        useESM: true,
      },
    ],
  },
}
