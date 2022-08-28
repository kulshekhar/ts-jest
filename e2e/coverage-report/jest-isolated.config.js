/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  collectCoverageFrom: ['**/*.js', '**/*.ts', '!**/node_modules/**', '!**/coverage/**'],
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        isolatedModules: true,
      },
    ],
  },
}
