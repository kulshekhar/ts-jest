import { defineConfig } from 'jest'

import './scripts/create-bundle.js'

export = defineConfig({
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__helpers__/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
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
})
