import type { Config } from 'jest'
import { createJsWithBabelPreset } from 'ts-jest'

export default {
  displayName: 'js-with-babel',
  ...createJsWithBabelPreset({
    babelConfig: true,
  }),
} satisfies Config
