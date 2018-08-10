module.exports = {
  transform: {
    '\\.ts$': '<rootDir>/../dist/index.js',
  },
  testRegex: '/__tests__/.+\\.test\\.ts$',
  collectCoverageFrom: ['<rootDir>/../src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  snapshotSerializers: ['<rootDir>/__serializers__/test-run-result.ts'],
};
