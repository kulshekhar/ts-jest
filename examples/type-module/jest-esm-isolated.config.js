import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  displayName: 'type-module',
  ...createDefaultEsmPreset({
    tsconfig: 'tsconfig-esm.json',
    isolatedModules: true,
  }),
}

export default jestConfig
