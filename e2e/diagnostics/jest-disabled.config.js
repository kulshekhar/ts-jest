/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../legacy.js',
  },
}
