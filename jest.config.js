module.exports = {
  transform: {
    '\\.ts$': '<rootDir>/dist/index.js',
  },
  testRegex: '/e2e/__tests__/.+\\.spec\\.ts$',
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  snapshotSerializers: ['<rootDir>/e2e/__serializers__/test-run-result.ts'],
};
