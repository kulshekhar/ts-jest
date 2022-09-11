/** @type {import('../../dist').JestConfigWithTsJest} */
module.exports = {
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        diagnostics: false,
      },
    ],
  },
}
