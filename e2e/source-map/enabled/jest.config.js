module.exports = {
  displayName: 'sourcemap-enabled',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.tsx?$': '<rootDir>/../../../dist/index.js'
  }
}
