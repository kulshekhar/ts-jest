import path from 'node:path'

import { sync as spawnSync } from 'execa'

import { createBundle } from './scripts/lib/bundle.js'

console.log('Install dependencies for all e2e test suites')

const e2eFolderPath = path.join(process.cwd(), 'e2e')
const bundle = createBundle()

spawnSync('npm', ['ci'], {
  cwd: e2eFolderPath,
})

spawnSync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle], {
  cwd: e2eFolderPath,
})

/** @type {import('jest').Config} */
export default {
  projects: ['e2e/**/jest-transpiler-esm.config.ts', 'e2e/**/jest-compiler-esm.config.ts'],
}
