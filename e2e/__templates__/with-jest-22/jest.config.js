const presets = require('ts-jest/presets')

module.exports = Object.assign({}, presets.defaults, {
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {} } },
})
