module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
      astTransformers: {
        before: ['<rootDir>/../../../dist/transformers/path-mapping.js'],
      },
    },
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../dist/index.js',
  },
}
