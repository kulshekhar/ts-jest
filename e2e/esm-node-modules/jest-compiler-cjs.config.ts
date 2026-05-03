import type { JestConfigWithTsJest } from 'ts-jest'
import { createJsWithTsPreset } from 'ts-jest'

export default {
  displayName: 'esm-node-modules-compiler-cjs',
  ...createJsWithTsPreset({
    tsconfig: '<rootDir>/tsconfig.spec.json',
  }),
} satisfies JestConfigWithTsJest
