/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  automock: true,
  moduleNameMapper: {
    react$: '<rootDir>/node_modules/react',
  },
  transform: {
    '^.+.[tj]sx?$': [
      '<rootDir>/../../../legacy.js',
      {
        isolatedModules: true,
        tsconfig: {
          allowJs: true,
        },
      },
    ],
  },
}
