import path from 'node:path'

import { defineConfig } from 'jest'

import type { TsJestTransformerOptions } from '../../src'

const rootDir = process.cwd()

export default defineConfig({
  displayName: 'typescript-pre-7-compat-transpiler-cjs',
  testMatch: ['<rootDir>/__tests__/compat.spec.ts', '<rootDir>/__tests__/hoist.spec.ts'],
  transform: {
    '^.+\\.ts$': [
      '<rootDir>/../../dist/index.js',
      {
        astTransformers: {
          before: [{ path: path.join(rootDir, 'transformer.cjs'), options: { expectProgram: false } }],
        },
        compiler: path.join(rootDir, 'node_modules/typescript'),
        tsconfig: path.join(rootDir, 'tsconfig-cjs-isolated.json'),
        useESM: false,
      } satisfies TsJestTransformerOptions,
    ],
  },
})
