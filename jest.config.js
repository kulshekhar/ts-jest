/** @type {import('./dist').InitialOptionsTsJest} */
module.exports = {
  collectCoverageFrom: ['src/**/*.ts'],
  modulePathIgnorePatterns: ['examples/.*', 'website/.*'],
  setupFilesAfterEnv: ['<rootDir>/src/__helpers__/setup-jest.ts'],
  snapshotSerializers: [require.resolve('jest-snapshot-serializer-raw')],
  testPathIgnorePatterns: ['src/__mocks__/*', '/node_modules/', '/examples/', '/e2e/.*/__tests__', '\\.snap$'],
  transform: {
    '^.+.tsx?$': [
      '<rootDir>/legacy.js',
      {
        tsconfig: 'tsconfig.spec.json',
        isolatedModules: true,
      },
    ],
  },
  coverageProvider: 'v8',
}
