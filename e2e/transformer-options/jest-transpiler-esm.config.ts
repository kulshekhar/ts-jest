import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'transformer-options-transpiler-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-esm-transpiler.spec.json',
        astTransformers: {
          before: [
            {
              path: '<rootDir>/node_modules/@formatjs/ts-transformer/ts-jest-integration',
              options: {
                removeDefaultMessage: true,
              },
            },
          ],
        },
        useESM: true,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
