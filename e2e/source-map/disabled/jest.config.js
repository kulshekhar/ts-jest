/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  displayName: 'sourcemap-disabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../../legacy.js',
      {
        tsconfig: {
          sourceMap: false,
        },
      },
    ],
  },
}
