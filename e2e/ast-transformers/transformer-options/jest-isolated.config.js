/** @type {import('../../../dist').JestConfigWithTsJest} */
module.exports = {
  transform: {
    '^.+.[tj]sx?$': [
      '<rootDir>/../../../legacy.js',
      {
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
    ],
  },
}
