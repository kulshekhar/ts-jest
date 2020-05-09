/** @type {import('@jest/types').Config.InitialOptions} */
/** @typedef {import('ts-jest')} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Ignore the TS project `outDir`
  // https://github.com/kulshekhar/ts-jest/issues/765
  testPathIgnorePatterns: ['<rootDir>/target/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: 'tsconfig-tests.json'
    },
  },
}
