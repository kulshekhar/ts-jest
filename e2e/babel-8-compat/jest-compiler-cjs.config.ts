import { defineConfig } from 'jest'

import { TS_JS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'babel-8-compat-compiler-cjs',
  testMatch: ['<rootDir>/__tests__/cjs.spec.ts'],
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        babelConfig: true,
        tsconfig: '<rootDir>/tsconfig-cjs.spec.json',
      } satisfies TsJestTransformerOptions,
    ],
  },
})
