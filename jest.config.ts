import type { Config } from 'jest'

import { TS_TRANSFORM_PATTERN } from './src'

import './scripts/create-bundle.js'

export default {
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
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
        },
      },
    ],
  },
  coverageProvider: 'v8',
} satisfies Config
