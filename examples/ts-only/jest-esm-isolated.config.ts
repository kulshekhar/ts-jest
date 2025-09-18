import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

export default {
  displayName: 'ts-only',
  ...createDefaultEsmPreset({
    tsconfig: 'tsconfig-esm-isolated.json',
  }),
} satisfies Config
