import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'test-utils-compiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-esm.spec.json',
        useESM: true,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
