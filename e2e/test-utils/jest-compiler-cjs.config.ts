import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'test-utils-compiler-cjs',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig-cjs.spec.json',
      },
    ],
  },
} satisfies JestConfigWithTsJest
