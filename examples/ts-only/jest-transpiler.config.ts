import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

export default {
  displayName: 'ts-only',
  ...createDefaultPreset({
    transpilation: true,
  }),
} satisfies Config
