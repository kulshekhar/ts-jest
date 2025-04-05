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
          isolatedModules: true,
        },
      },
    ],
  },
  coverageProvider: 'v8',
}

export default config
