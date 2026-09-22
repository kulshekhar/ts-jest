import { defineConfig } from 'jest'

import { TS_TRANSFORM_PATTERN } from '../../dist/constants.js'
import type { TsJestTransformerOptions } from '../../src'

export default defineConfig({
  displayName: 'transformer-options-compiler-cjs',
  testEnvironment: 'jsdom',
  transform: {
    [TS_TRANSFORM_PATTERN]: [
      '<rootDir>/../../dist/index.js',
      {
        tsconfig: '<rootDir>/tsconfig-cjs.spec.json',
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
      } satisfies TsJestTransformerOptions,
    ],
  },
})
