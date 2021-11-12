/** @type {import('../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  displayName: 'type-check',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-ts'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../dist/index.js',
  },
}
