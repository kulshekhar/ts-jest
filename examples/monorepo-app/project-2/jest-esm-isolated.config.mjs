import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'project-2',
  ...createDefaultEsmPreset({
    tsconfig: 'project-2/tsconfig-esm-isolated.json',
  }),
}
