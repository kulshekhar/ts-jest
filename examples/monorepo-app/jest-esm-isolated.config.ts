import type { Config } from 'jest'

export default {
  projects: [
    '<rootDir>/type-commonjs/jest-esm-isolated.config.ts',
    '<rootDir>/type-module/jest-esm-isolated.config.ts',
  ],
} satisfies Config
