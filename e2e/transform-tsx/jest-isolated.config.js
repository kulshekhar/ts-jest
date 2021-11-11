/** @type {import('../../dist/types').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': '<rootDir>/../../dist/index.js',
  },
}
