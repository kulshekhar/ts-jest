/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
}
