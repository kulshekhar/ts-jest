import { type JestConfigWithTsJest, ESM_TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'enum-transpiler-cjs',
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig-cjs-transpiler.spec.json',
      },
    ],
  },
} satisfies JestConfigWithTsJest
