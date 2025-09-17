import type { Config } from 'jest'

export default {
  projects: [
    '<rootDir>/type-commonjs/jest-esm-transpiler.config.ts',
    '<rootDir>/type-module/jest-esm-transpiler.config.ts',
  ],
} satisfies Config
