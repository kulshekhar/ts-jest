import type { Config } from 'jest'
import { createJsWithTsPreset } from 'ts-jest'

export default {
  displayName: 'js-with-ts',
  ...createJsWithTsPreset({
    tsconfig: 'tsconfig-isolated.json',
  }),
  transformIgnorePatterns: ['!node_modules/(?!lodash-es)'],
} satisfies Config
