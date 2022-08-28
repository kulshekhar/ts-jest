/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        diagnostics: {
          exclude: ['**/__tests__/diagnostics.spec.ts'],
        },
      },
    ],
  },
}
