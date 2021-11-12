/** @type {import('../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  displayName: 'no-type-check',
  roots: ['<rootDir>', '<rootDir>/../__tests__/for-ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      babelConfig: true,
    },
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../dist/index.js',
  },
}
