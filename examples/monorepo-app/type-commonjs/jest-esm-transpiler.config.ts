import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

export default {
  displayName: 'type-commonjs',
  ...createDefaultEsmPreset({
    tsconfig: '<rootDir>/tsconfig-esm.json',
    transpilation: true,
  }),
} satisfies Config
