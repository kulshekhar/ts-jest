const base = require('./jest.config');

module.exports = Object.assign({}, base, {
  testRegex: 'e2e/__tests__/.*(?!watch)\\.spec\\.ts$',
  snapshotSerializers: ['<rootDir>/e2e/__serializers__/test-run-result.ts'],
});
