import { type JestConfigWithTsJest, TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'transform-js-transpiler-cjs',
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-cjs-transpiler.spec.json',
      },
    ],
  },
} satisfies JestConfigWithTsJest
