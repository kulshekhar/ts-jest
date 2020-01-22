module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: { 'ts-jest': { tsConfig: {}, babelConfig: 'babel.config.js' } },
}
