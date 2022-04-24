/** @type {import('../../../dist').InitialOptionsTsJest} */
module.exports = {
  automock: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        allowJs: true,
      },
    },
  },
  moduleNameMapper: {
    react$: '<rootDir>/node_modules/react',
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../legacy.js',
  },
}
