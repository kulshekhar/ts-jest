/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': '<rootDir>/../../legacy.js',
  },
}
