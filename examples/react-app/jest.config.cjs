const { createDefaultPreset } = require('ts-jest')

const defaultPreset = createDefaultPreset({
  tsconfig: 'tsconfig.spec.json'
})

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'react-app',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  transform: {
    ...defaultPreset.transform,
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
}
