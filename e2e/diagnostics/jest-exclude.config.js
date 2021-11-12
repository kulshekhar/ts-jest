/** @type {import('../../dist/types').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: {
        exclude: ['**/__tests__/diagnostics.spec.ts'],
      },
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../dist/index.js',
  },
}
