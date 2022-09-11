/** @type {import('../../dist').JestConfigWithTsJest} */
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
