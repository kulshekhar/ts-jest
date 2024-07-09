import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createDefaultEsmPreset({
    tsconfig: 'tests/project-2/tsconfig-esm.json',
    isolatedModules: true,
  })
}
