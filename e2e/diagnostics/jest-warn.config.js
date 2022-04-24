/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../legacy.js',
  },
}
