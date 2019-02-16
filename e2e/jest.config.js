module.exports = {
  rootDir: '..',
  transform: {
    '\\.ts$': '<rootDir>/dist/index.js',
  },
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  snapshotSerializers: [
    '<rootDir>/e2e/__serializers__/run-result.ts',
    '<rootDir>/e2e/__serializers__/processed-source.ts',
  ],
  verbose: true,
  cacheDirectory: '<rootDir>/.cache/e2e',
}
