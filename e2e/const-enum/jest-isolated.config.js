/** @type {import('../../dist').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/../../legacy.js',
      {
        'ts-jest': {
          isolatedModules: true,
        },
      },
    ],
  },
}
