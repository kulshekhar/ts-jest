import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'ts-only',
  ...createDefaultEsmPreset({
    tsconfig: 'tsconfig-esm-isolated.json',
    useESM: true,
  }),
}
