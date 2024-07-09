import { createDefaultEsmPreset } from 'ts-jest'

const defaultPreset = createDefaultEsmPreset({
  tsconfig: 'tsconfig-esm.spec.json',
})

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...defaultPreset,
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  transform: {
    ...defaultPreset.transform,
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
}
