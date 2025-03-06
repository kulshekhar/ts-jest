import { createDefaultPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  displayName: 'type-module',
  ...createDefaultPreset({
    tsconfig: 'tsconfig-isolated.json',
  }),
}

export default jestConfig
