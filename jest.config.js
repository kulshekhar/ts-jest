module.exports = {
  transform: {
    '^.+\\.tsx?$': '<rootDir>/dist/index.js',
  },
  testRegex: '(tests|e2e)/__tests__/.+\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/watch.spec.ts$'],
  coverageReporters: ['text'],
  coverageDirectory: 'test_coverage_dir',
  collectCoverageFrom: ['src/**/*.tsx', 'src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'ts-jest': {
      tsConfigFile: 'tsconfig.base.json',
    },
  },
  setupTestFrameworkScriptFile:
    '<rootDir>/tests/__helpers__/setup-test-framework.ts',
};
