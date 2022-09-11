/** @type {import('../../dist').JestConfigWithTsJest} */
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  resolver: '<rootDir>/mjs-resolver.ts',
  transform: {
    '^.+\\.m?tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
}
