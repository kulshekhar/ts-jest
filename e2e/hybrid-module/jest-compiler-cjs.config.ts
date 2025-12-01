import type { Config } from 'jest'
import { TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'hybrid-module-compiler-cjs',
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
} satisfies Config
