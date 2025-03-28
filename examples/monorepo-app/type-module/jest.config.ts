import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

export default {
  displayName: 'type-module',
  ...createDefaultEsmPreset(),
} satisfies Config
