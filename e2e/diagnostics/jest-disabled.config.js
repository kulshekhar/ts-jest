module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../dist/index.js',
  },
}
