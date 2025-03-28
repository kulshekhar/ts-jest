import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

export default {
  displayName: 'type-commonjs',
  ...createDefaultPreset(),
} satisfies Config
