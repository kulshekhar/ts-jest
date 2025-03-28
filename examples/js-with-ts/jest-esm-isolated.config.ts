import type { Config } from 'jest'
import { createJsWithTsEsmPreset } from 'ts-jest'

export default {
  displayName: 'js-with-ts',
  ...createJsWithTsEsmPreset({
    tsconfig: 'tsconfig-esm-isolated.json',
  }),
} satisfies Config
