module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../dist/index.js',
  },
}
