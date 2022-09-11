/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  displayName: 'no-type-check',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-ts'],
  transform: {
    '^.+.[tj]sx?$': [
      '<rootDir>/../../../legacy.js',
      {
        isolatedModules: true,
        babelConfig: true,
      },
    ],
  },
}
