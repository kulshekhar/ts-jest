import path from 'node:path'

import { sync as spawnSync } from 'execa'
import type { Config } from 'jest'

// @ts-expect-error not a ts file
import { createBundle } from './scripts/lib/bundle'

console.log('Install dependencies for all e2e test suites')

const e2eFolderPath = path.join(process.cwd(), 'e2e')
const bundle = createBundle()

spawnSync('npm', ['ci'], {
  cwd: e2eFolderPath,
})

spawnSync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle], {
  cwd: e2eFolderPath,
})

export default {
  projects: ['e2e/**/jest-transpiler-esm.config.ts', 'e2e/**/jest-compiler-esm.config.ts'],
} satisfies Config
