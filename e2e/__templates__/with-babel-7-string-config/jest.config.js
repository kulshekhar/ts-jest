module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsconfig: {}, babelConfig: 'babel.config.js' } },
}
