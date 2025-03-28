import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

export default {
  displayName: 'type-module',
  ...createDefaultPreset({
    tsconfig: '<rootDir>/tsconfig-isolated.json',
  }),
} satisfies Config
