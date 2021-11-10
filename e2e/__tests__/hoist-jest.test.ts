import path from 'path'

import execa from 'execa'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const { createBundle } = require('../../scripts/lib/bundle')

const executeTest = (dirName: string): void => {
  test(`successfully runs the tests with isolatedModules: false`, () => {
    const { json } = runWithJson(dirName)

    expect(json.success).toBe(true)
  })

  test(`successfully runs the tests with isolatedModules true`, () => {
    const { json } = runWithJson(dirName, ['-c=jest-isolated.config.js'])

    expect(json.success).toBe(true)
  })
}

describe('non-ts-factory', () => {
  const DIR = path.resolve(__dirname, '..', 'hoist-jest', 'non-ts-factory')

  beforeAll(() => {
    runNpmInstall(DIR)
    const bundle = createBundle()
    execa.sync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle], {
      cwd: DIR,
    })
  })

  executeTest(DIR)
})

describe('ts-factory', () => {
  const DIR = path.resolve(__dirname, '..', 'hoist-jest', 'ts-factory')

  beforeAll(() => {
    runNpmInstall(DIR)
  })

  executeTest(DIR)
})
