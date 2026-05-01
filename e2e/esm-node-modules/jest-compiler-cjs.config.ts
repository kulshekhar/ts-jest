import type { JestConfigWithTsJest } from 'ts-jest'
import { TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'esm-node-modules-compiler-cjs',
  transformIgnorePatterns: [],
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
} satisfies JestConfigWithTsJest
