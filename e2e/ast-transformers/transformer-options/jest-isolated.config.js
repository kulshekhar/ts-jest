/** @type {import('../../../dist').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      isolatedModules: true,
      astTransformers: {
        before: [
          {
            path: '<rootDir>/node_modules/@formatjs/ts-transformer/ts-jest-integration',
            options: {
              removeDefaultMessage: true,
            },
          },
        ],
      },
    },
  },
  transform: {
    '^.+.[tj]sx?$': '<rootDir>/../../../legacy.js',
  },
}
