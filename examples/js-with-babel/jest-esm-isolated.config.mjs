import { createJsWithBabelEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createJsWithBabelEsmPreset({
    babelConfig: true,
    tsconfig: 'tsconfig-esm.json',
    isolatedModules: true,
  })
}
