import { defineConfig } from 'jest'

import { TS_JS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'presets-transpiler-cjs',
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-cjs-transpiler.spec.json',
      } satisfies TsJestTransformerOptions,
    ],
  },
})
