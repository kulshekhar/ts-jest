import type { Config } from 'jest'
import { createJsWithTsPreset } from 'ts-jest'

export default {
  displayName: 'js-with-ts',
  ...createJsWithTsPreset(),
  transformIgnorePatterns: ['!node_modules/(?!lodash-es)'],
} satisfies Config
