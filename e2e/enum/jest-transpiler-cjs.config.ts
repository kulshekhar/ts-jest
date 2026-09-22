import { defineConfig } from 'jest'

import { ESM_TS_JS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'enum-transpiler-cjs',
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-cjs-transpiler.spec.json',
      } satisfies TsJestTransformerOptions,
    ],
  },
})
