/** @type {import('../../dist').JestConfigWithTsJest} */
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
