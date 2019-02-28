module.exports = {
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/src/__helpers__/setup.ts'],
  transform: {
    '\\.ts$': '<rootDir>/dist/index.js',
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/__*__/*',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
  snapshotSerializers: ['<rootDir>/src/__serializers__/processed-source.ts'],
  cacheDirectory: '<rootDir>/.cache/unit',
}
