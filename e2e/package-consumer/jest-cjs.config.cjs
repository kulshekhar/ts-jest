const { createDefaultPreset } = require('ts-jest')

module.exports = {
  rootDir: __dirname,
  testMatch: ['<rootDir>/__tests__/cjs.test.ts'],
  transform: createDefaultPreset({ tsconfig: '<rootDir>/tsconfig-cjs.json' }).transform,
}
