// /** @type {import('./dist').JestConfigWithTsJest} */
// module.exports = {
//   collectCoverageFrom: ['src/**/*.ts'],
//   modulePathIgnorePatterns: ['examples/.*', 'website/.*'],
//   setupFilesAfterEnv: ['<rootDir>/src/__helpers__/setup-jest.ts'],
//   snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
//   testPathIgnorePatterns: ['src/__mocks__/*', '/node_modules/', '/examples/', '/e2e/.*/__tests__', '\\.snap$'],
//   transform: {
//     '^.+.tsx?$': [
//       '<rootDir>/legacy.js',
//       {
//         tsconfig: 'tsconfig.spec.json',
//         isolatedModules: true,
//       },
//     ],
//   },
//   coverageProvider: 'v8',
// }

import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from './src'
import './scripts/create-bundle.js'

const config: JestConfigWithTsJest = {
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__helpers__/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/dist/index.js',
      {
        tsconfig: {
          target: 'ES2015',
        },
        isolatedModules: true,
      },
    ],
  },
  coverageProvider: 'v8',
}

export default config
