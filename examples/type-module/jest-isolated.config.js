import { createDefaultPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  displayName: 'type-module',
  ...createDefaultPreset({
    isolatedModules: true,
  }),
}

export default jestConfig
