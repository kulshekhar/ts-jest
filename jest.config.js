module.exports = {
  rootDir: 'src',
  transform: {
    '\\.ts$': '<rootDir>/../dist/index.js',
  },
  testRegex: '\\.(spec|test)\\.ts$',
  coverageDirectory: '<rootDir>/../coverage/unit',
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.ts',
    '!<rootDir>/../src/**/*.spec.ts',
    '!<rootDir>/../src/**/*.test.ts',
    '!<rootDir>/../src/**/__*__/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
};
