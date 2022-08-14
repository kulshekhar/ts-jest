/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true,
    },
  },
  resolver: '<rootDir>/mjs-resolver.ts',
  transform: {
    '^.+\\.m?tsx?$': '<rootDir>/../../legacy.js',
  },
}
