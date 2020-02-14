module.exports = {
  name: 'my-library',
  displayName: 'my-app',
  testEnvironment: 'node',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      experimental: true,
      compilerHost: false,
    },
  },
}
