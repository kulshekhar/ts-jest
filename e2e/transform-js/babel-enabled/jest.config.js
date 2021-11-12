/** @type {import('../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  displayName: 'babel-enabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-babel'],
  globals: {
    'ts-jest': {
      babelConfig: true,
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    '@babel/core': '<rootDir>/../../../node_modules/@babel/core',
    'babel-jest': '<rootDir>/../../../node_modules/babel-jest',
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../dist/index.js',
  },
}
