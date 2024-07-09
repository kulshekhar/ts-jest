import { createDefaultEsmPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createDefaultEsmPreset({
    tsconfig: 'tsconfig-esm.json',
    useESM: true,
  }),
}
