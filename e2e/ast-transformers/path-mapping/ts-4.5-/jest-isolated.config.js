/** @type {import('../../../../dist/types').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/../tsconfig.json',
      astTransformers: {
        before: ['ts-jest/dist/transformers/path-mapping.js'],
      },
    },
  },
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.[tj]sx?$': 'ts-jest',
  },
}
