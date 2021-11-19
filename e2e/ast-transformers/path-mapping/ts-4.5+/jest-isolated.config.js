/** @type {import('../../../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/../tsconfig.json',
      astTransformers: {
        before: ['<rootDir>/../../../../dist/transformers/path-mapping.js'],
      },
    },
  },
  roots: ['<rootDir>', '<rootDir>/../__tests__'],
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../../dist/index.js',
  },
}
