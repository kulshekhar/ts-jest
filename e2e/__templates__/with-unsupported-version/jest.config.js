module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsconfig: {}, diagnostics: { ignoreCodes: [5023, 5024] } } },
}
