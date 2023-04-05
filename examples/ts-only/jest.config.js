/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',

  // #region support for .mts files as an extension
  // moduleFileExtensions: [
  //   "js",
  //   "mjs",
  //   "cjs",
  //   "jsx",
  //   "ts",
  //   "tsx",
  //   "json",
  //   "node"
  // ],
  moduleFileExtensions: ['js', 'ts', 'mts'],

  resolver: '<rootDir>/mjs-resolver.ts',
  testMatch: ['**/__tests__/**/*.(m)?[jt]s?(x)', '**/?(*.)+(spec|test).(m)?[tj]s?(x)'],

  transform: {
    '^.+\\.mtsx?$': ['ts-jest'],
  },
  // #endregion support for .mts files as an extension
}
