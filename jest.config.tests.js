const base = require('./jest.config');

module.exports = Object.assign({}, base, {
  testRegex: 'tests/__tests__/.*(?!watch)\\.spec\\.ts$',
});
