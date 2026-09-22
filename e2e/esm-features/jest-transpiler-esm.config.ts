import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'esm-features-transpiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-esm-transpiler.spec.json',
        useESM: true,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
