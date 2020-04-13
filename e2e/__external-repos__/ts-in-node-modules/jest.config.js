module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    'app/plugins/sdk' : '<rootDir>/node_modules/grafana-sdk-mocks/app/plugins/sdk.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!grafana-sdk-mocks/.*)',
  ],
}
