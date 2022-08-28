/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
}
