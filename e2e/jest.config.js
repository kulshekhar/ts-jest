const base = require('../jest.config');

module.exports = {
  ...base,
  rootDir: '.',
  testRegex: '/__tests__/.+\\.(test|spec)\\.ts$',
  coverageDirectory: '<rootDir>/../coverage/e2e',
  snapshotSerializers: ['<rootDir>/__serializers__/test-run-result.ts'],
};
