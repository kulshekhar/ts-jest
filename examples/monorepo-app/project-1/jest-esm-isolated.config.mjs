import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'project-1',
  ...createDefaultEsmPreset({
    tsconfig: 'project-1/tsconfig-esm.json',
    isolatedModules: true,
  })
}
