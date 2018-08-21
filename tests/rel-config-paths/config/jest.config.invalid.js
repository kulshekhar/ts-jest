module.exports = {
  errorOnDeprecated: true,
  globals: {
    'ts-jest': {
      tsConfigFile: './tsconfig.test.json',
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  rootDir: '../',
  testMatch: ['<rootDir>/custom-test-dir/**/*.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
