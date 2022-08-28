/** @type {import('../../../dist').InitialOptionsTsJest} */
module.exports = {
  displayName: 'type-check',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-ts'],
  transform: {
    '^.+.[tj]sx?$': [
      '<rootDir>/../../../legacy.js',
      {
        babelConfig: true,
      },
    ],
  },
}
