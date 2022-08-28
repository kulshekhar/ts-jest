/** @type {import('../../../dist').InitialOptionsTsJest} */
module.exports = {
  displayName: 'sourcemap-enabled-isolated',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../../legacy.js',
      {
        isolatedModules: true,
      },
    ],
  },
}
