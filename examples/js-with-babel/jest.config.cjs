/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: {
    '^.+\.[tj]sx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
}
