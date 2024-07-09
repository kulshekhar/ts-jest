import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createDefaultEsmPreset({
    tsconfig: 'tests/project-1/tsconfig-esm.json',
  })
}
