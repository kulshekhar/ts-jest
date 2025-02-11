import { type JestConfigWithTsJest, TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'tsconfig-projects-transpiler-cjs',
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: 'ts-jest',
  },
} satisfies JestConfigWithTsJest
