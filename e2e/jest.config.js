const jestBaseConfig = require('../jest-base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...jestBaseConfig,
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/__tests__/**/*.test.ts'],
  snapshotSerializers: [
    '<rootDir>/e2e/__serializers__/run-result.ts',
    '<rootDir>/e2e/__serializers__/processed-source.ts',
  ],
  verbose: true,
  cacheDirectory: '<rootDir>/.cache/e2e',
}
