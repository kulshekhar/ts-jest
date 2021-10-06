import path from 'path'

import { wrap } from 'jest-snapshot-serializer-raw'

import runJest, { onNodeVersions } from '../run-jest'
import { extractSummary } from '../utils'

const DIR = path.resolve(__dirname, '..', 'native-esm-js', 'non-isolated')
const ISOLATED_MODULES_DIR = path.resolve(__dirname, '..', 'native-esm-js', 'isolated')

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('runs test with native ESM and isolatedModules: false', () => {
    const { exitCode, stderr, stdout } = runJest(DIR, ['native-esm.spec.ts'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })
    const { summary } = extractSummary(stderr)

    expect(wrap(summary)).toMatchSnapshot()
    expect(stdout).toBe('')
    expect(exitCode).toBe(0)
  })

  test('runs test with native ESM and isolatedModules: true', () => {
    const { exitCode, stderr, stdout } = runJest(ISOLATED_MODULES_DIR, ['native-esm.spec.ts'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })
    const { summary } = extractSummary(stderr)

    expect(wrap(summary)).toMatchSnapshot()
    expect(stdout).toBe('')
    expect(exitCode).toBe(0)
  })
})

// The versions where Top-Level Await is supported
onNodeVersions('>=14.3.0', () => {
  test('supports top-level await and isolatedModules: false', () => {
    const { exitCode, stderr, stdout } = runJest(DIR, ['native-esm-tla.spec.ts'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })
    const { summary } = extractSummary(stderr)

    expect(wrap(summary)).toMatchSnapshot()
    expect(stdout).toBe('')
    expect(exitCode).toBe(0)
  })

  test('supports top-level await and isolatedModules: true', () => {
    const { exitCode, stderr, stdout } = runJest(ISOLATED_MODULES_DIR, ['native-esm-tla.spec.ts'], {
      nodeOptions: '--experimental-vm-modules --no-warnings',
    })
    const { summary } = extractSummary(stderr)

    expect(wrap(summary)).toMatchSnapshot()
    expect(stdout).toBe('')
    expect(exitCode).toBe(0)
  })
})
