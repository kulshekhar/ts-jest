/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  displayName: 'sourcemap-disabled-isolated',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../../legacy.js',
      {
        isolatedModules: true,
        tsconfig: {
          sourceMap: false,
        },
      },
    ],
  },
}
