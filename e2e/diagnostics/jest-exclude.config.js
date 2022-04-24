/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: {
        exclude: ['**/__tests__/diagnostics.spec.ts'],
      },
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../legacy.js',
  },
}
