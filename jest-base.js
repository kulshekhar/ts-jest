/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json',
    },
  },
  transform: {
    '\\.ts$': '<rootDir>/dist/index.js',
  },
  testEnvironment: 'node',
}
