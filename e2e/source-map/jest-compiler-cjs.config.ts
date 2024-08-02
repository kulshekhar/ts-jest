import { type JestConfigWithTsJest, TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'source-map-compiler-cjs',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig-cjs.spec.json',
      },
    ],
  },
} satisfies JestConfigWithTsJest
