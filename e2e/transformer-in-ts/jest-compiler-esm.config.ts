import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'transformer-in-ts-compiler-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-esm.spec.json',
        astTransformers: {
          before: [
            {
              path: '<rootDir>/../../src/transformers/hoist-jest.ts',
            },
          ],
        },
        useESM: true,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
