/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  collectCoverageFrom: ['**/*.js', '**/*.ts', '!**/node_modules/**', '!**/coverage/**'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../legacy.js',
  },
}
