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
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  moduleNameMapper: {
    react$: '<rootDir>/node_modules/react',
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../dist/index.js',
  },
}
