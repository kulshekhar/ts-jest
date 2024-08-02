const { sync: spawnSync } = require("execa");
const path = require('path')
const { createBundle } = require('./scripts/lib/bundle')

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
module.exports = {
  projects: ['e2e/**/jest-transpiler-cjs.config.ts', 'e2e/**/jest-compiler-cjs.config.ts'],
}
