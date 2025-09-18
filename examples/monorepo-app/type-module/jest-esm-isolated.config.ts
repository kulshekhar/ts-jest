import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

export default {
  displayName: 'type-module',
  ...createDefaultEsmPreset({
    tsconfig: '<rootDir>/tsconfig-esm-isolated.json',
  }),
} satisfies Config
