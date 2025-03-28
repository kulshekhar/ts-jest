import type { Config } from 'jest'
import { createJsWithBabelPreset } from 'ts-jest'

export default {
  displayName: 'js-with-babel',
  ...createJsWithBabelPreset({
    babelConfig: true,
    tsconfig: 'tsconfig-isolated.json',
  }),
} satisfies Config
