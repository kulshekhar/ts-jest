import { defineConfig } from 'jest'

export default defineConfig({
  rootDir: '..',
  roots: ['<rootDir>/e2e'],
  testMatch: ['<rootDir>/e2e/__tests__/**/*.spec.ts', '<rootDir>/e2e/__tests__/**/*.test.ts'],
  testTimeout: 180_000,
  transform: {
    '^.+\\.tsx?$': [
      '<rootDir>/dist/index.js',
      {
        tsconfig: {
          isolatedModules: true,
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ESNext',
        },
      },
    ],
  },
})
