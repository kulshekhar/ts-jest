module.exports = {
  name: 'my-app',
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
