module.exports = {
  displayName: 'sourcemap-disabled-isolated',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        sourceMap: false,
      },
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../../dist/index.js',
  },
}
