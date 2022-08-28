/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        diagnostics: {
          ignoreCodes: 'TS2741',
        },
      },
    ],
  },
}
