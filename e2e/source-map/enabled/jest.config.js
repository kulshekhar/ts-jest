/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  displayName: 'sourcemap-enabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.tsx?$': '<rootDir>/../../../legacy.js',
  },
}
