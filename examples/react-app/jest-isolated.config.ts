import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

const defaultPreset = createDefaultPreset({
  tsconfig: 'tsconfig-isolated.spec.json',
})

export default {
  displayName: 'react-app',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  transform: {
    ...defaultPreset.transform,
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
} satisfies Config
