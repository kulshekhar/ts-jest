import type { Config } from 'jest'
import { TS_JS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  displayName: 'hybrid-module-compiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
} satisfies Config
