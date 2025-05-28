import { type JestConfigWithTsJest, TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'source-map-compiler-cjs',
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig-cjs.spec.json',
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/../node_modules/(?!strip-ansi)'],
} satisfies JestConfigWithTsJest
