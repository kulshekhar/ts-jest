/** @type {import('@jest/types').Config.InitialOptions} */
/** @typedef {import('ts-jest')} */

const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig-base');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Ignore the TS project `outDir`
  // https://github.com/kulshekhar/ts-jest/issues/765
  testPathIgnorePatterns: ['<rootDir>/target/'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: 'tsconfig-tests.json'
    },
  },
}
