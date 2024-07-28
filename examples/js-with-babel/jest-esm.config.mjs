import { createJsWithBabelEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'js-with-babel',
  ...createJsWithBabelEsmPreset({
    babelConfig: true,
    tsconfig: 'tsconfig-esm.json'
  })
}
