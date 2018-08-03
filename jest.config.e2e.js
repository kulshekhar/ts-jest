const base = require('./jest.config');

module.exports = Object.assign({}, base, {
  testRegex: 'e2e/__tests__/.*(?!watch)\\.spec\\.ts$',
});
