/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        isolatedModules: true,
      },
    ],
  },
}
