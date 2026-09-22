import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'babel-8-compat-compiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['<rootDir>/__tests__/esm.spec.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        babelConfig: true,
        tsconfig: '<rootDir>/tsconfig-esm.spec.json',
        useESM: true,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
