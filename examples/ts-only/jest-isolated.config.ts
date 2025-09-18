import type { Config } from 'jest'
import { createDefaultPreset } from 'ts-jest'

export default {
  displayName: 'ts-only',
  ...createDefaultPreset({
    tsconfig: 'tsconfig-isolated.json',
  }),
} satisfies Config
