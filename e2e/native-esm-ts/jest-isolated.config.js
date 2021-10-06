module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../dist/index.js',
  },
}
