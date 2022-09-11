/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  displayName: 'babel-enabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-babel'],
  moduleNameMapper: {
    '@babel/core': '<rootDir>/../../../node_modules/@babel/core',
    'babel-jest': '<rootDir>/../../../node_modules/babel-jest',
  },
  transform: {
    '^.+.[tj]sx?$': [
      '<rootDir>/../../../legacy.js',
      {
        babelConfig: true,
        isolatedModules: true,
      },
    ],
  },
}
