import { fileURLToPath } from 'node:url'

import { createDefaultEsmPreset } from 'ts-jest'

export default {
  rootDir: fileURLToPath(new URL('.', import.meta.url)),
  testMatch: ['<rootDir>/__tests__/esm.test.ts'],
  transform: createDefaultEsmPreset({ tsconfig: '<rootDir>/tsconfig-esm.json' }).transform,
}
