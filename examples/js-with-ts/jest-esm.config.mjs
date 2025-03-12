import { createJsWithTsPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'js-with-ts',
  ...createJsWithTsPreset({
    tsconfig: 'tsconfig-esm.json',
  }),
}
