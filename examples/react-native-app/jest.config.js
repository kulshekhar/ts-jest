/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'jest-expo',
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
