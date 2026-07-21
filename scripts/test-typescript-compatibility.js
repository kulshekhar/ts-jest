const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const rootDir = path.join(__dirname, '..')
const fixtureDir = path.join(rootDir, 'e2e/typescript-compatibility')
const jestBin = path.join(rootDir, 'node_modules/jest/bin/jest.js')
const args = process.argv.slice(2)
const usage = 'Usage: test-typescript-compatibility --api-major <major> --compiler-bin <name> [options]'

const optionValues = (name) =>
  args.flatMap((argument, index) => {
    if (argument !== name) return []

    const value = args[index + 1]

    if (!value || value.startsWith('--')) throw new Error(usage)

    return [value]
  })

const [apiMajor] = optionValues('--api-major')
const compilerBins = optionValues('--compiler-bin')
const hasNativeCompiler = args.includes('--native')
const shouldCheckPublicTypes = args.includes('--check-public-types')

if (!apiMajor || compilerBins.length === 0) {
  throw new Error(usage)
}

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd ?? rootDir,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const runExpectingFailure = (command, commandArgs, expectedOutput, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.error) throw result.error
  assert.notEqual(result.status, 0, `Expected ${command} to fail`)
  assert.match(`${result.stdout}${result.stderr}`, expectedOutput)
}

const binPath = (name) =>
  path.join(rootDir, 'node_modules', '.bin', `${name}${process.platform === 'win32' ? '.cmd' : ''}`)

const compilerModule = require(path.join(rootDir, 'node_modules/typescript'))
assert.equal(compilerModule.version.split('.')[0], apiMajor, `Expected TypeScript API ${apiMajor}.x`)

run(process.execPath, [jestBin, '--config', 'jest-compiler-cjs.config.cjs', '--runInBand', '--no-cache'], {
  cwd: fixtureDir,
})
run(process.execPath, [jestBin, '--config', 'jest-transpiler-cjs.config.cjs', '--runInBand', '--no-cache'], {
  cwd: fixtureDir,
})
run(
  process.execPath,
  [
    '--experimental-vm-modules',
    '--no-warnings',
    jestBin,
    '--config',
    'jest-compiler-esm.config.cjs',
    '--runInBand',
    '--no-cache',
  ],
  { cwd: fixtureDir }
)
run(
  process.execPath,
  [
    '--experimental-vm-modules',
    '--no-warnings',
    jestBin,
    '--config',
    'jest-transpiler-esm.config.cjs',
    '--runInBand',
    '--no-cache',
  ],
  { cwd: fixtureDir }
)

for (const compilerBin of compilerBins) {
  run(binPath(compilerBin), ['--version'])
  if (shouldCheckPublicTypes) {
    run(binPath(compilerBin), ['--project', path.join(fixtureDir, 'tsconfig-public-types.json')])
  }
}

if (apiMajor === '6') {
  runExpectingFailure(
    process.execPath,
    [jestBin, '--config', 'jest-explicit-node10.config.cjs', '--runInBand', '--no-cache'],
    /TS5107/,
    { cwd: fixtureDir }
  )
}

if (hasNativeCompiler) {
  const nativeCompiler = require(require.resolve('@typescript/native', { paths: [rootDir] }))
  assert.equal(nativeCompiler.version.split('.')[0], '7', 'Expected the native tsc to be TypeScript 7.x')

  const { Importer } = require(path.join(rootDir, 'dist/utils/importer'))
  assert.throws(
    () => new Importer().typescript('Testing direct TypeScript 7 usage.', '@typescript/native'),
    /does not expose the JavaScript compiler API required by ts-jest/
  )
}
