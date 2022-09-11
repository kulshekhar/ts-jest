/** @type {import('../../dist').JestConfigWithTsJest} */
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
