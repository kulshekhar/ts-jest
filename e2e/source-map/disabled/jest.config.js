/** @type {import('../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  displayName: 'sourcemap-disabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  globals: {
    'ts-jest': {
      tsconfig: {
        sourceMap: false,
      },
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../../dist/index.js',
  },
}
