const { jestPreset } = require('ts-jest');

module.exports = {
  ...jestPreset,
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {} } },
};
