module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {}, diagnostics: { ignoreCodes: [5023, 5024] } } },
  cacheDirectory: './node_modules/.cache',
}
