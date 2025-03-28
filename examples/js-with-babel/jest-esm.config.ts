import type { Config } from 'jest'
import { createJsWithBabelEsmPreset } from 'ts-jest'

export default {
  displayName: 'js-with-babel',
  ...createJsWithBabelEsmPreset({
    babelConfig: true,
    tsconfig: 'tsconfig-esm.json',
  }),
} satisfies Config
