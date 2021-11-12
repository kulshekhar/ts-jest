/** @type {import('../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  displayName: 'sourcemap-enabled-isolated',
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+.tsx?$': '<rootDir>/../../../dist/index.js',
  },
}
