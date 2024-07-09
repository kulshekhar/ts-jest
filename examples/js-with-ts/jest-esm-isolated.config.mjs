import { createJsWithTsPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createJsWithTsPreset({
    tsconfig: 'tsconfig-esm.json',
    isolatedModules: true,
  })
}
