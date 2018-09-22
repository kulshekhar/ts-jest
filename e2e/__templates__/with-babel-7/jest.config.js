module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {}, babelConfig: true } },
  cacheDirectory: './node_modules/.cache',
}
