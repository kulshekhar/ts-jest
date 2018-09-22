const { jestPreset } = require('ts-jest')

module.exports = Object.assign({}, jestPreset, {
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {} } },
})
