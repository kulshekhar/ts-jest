/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
}
