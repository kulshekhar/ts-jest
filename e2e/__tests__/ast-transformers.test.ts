import path from 'path'

import execa from 'execa'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall, tsJestBundle } from '../utils'

const AST_TRANSFORMERS_DIR_NAME = 'ast-transformers'

const executeTest = (testDir: string): void => {
  test(`successfully runs the tests inside ${testDir} with isolatedModules: false`, () => {
    const { json } = runWithJson(testDir)

    expect(json.success).toBe(true)
  })

  test(`successfully runs the tests inside ${testDir} with isolatedModules: true`, () => {
    const { json } = runWithJson(testDir, ['-c=jest-isolated.config.js'])

    expect(json.success).toBe(true)
  })
}

describe('transformer-options', () => {
  const TRANSFORM_OPT_DIR_NAME = 'transformer-options'

  beforeAll(() => {
    runNpmInstall(path.join(__dirname, '..', AST_TRANSFORMERS_DIR_NAME, TRANSFORM_OPT_DIR_NAME))
  })

  test(`successfully runs the tests inside ${AST_TRANSFORMERS_DIR_NAME}/${TRANSFORM_OPT_DIR_NAME}`, () => {
    const { json } = runWithJson(`${AST_TRANSFORMERS_DIR_NAME}/${TRANSFORM_OPT_DIR_NAME}`)

    expect(json.success).toBe(true)
  })
})

describe('hoist-jest', () => {
  const HOIST_JEST_DIR_NAME = 'hoist-jest'
  const DIR = path.join(__dirname, '..', AST_TRANSFORMERS_DIR_NAME, HOIST_JEST_DIR_NAME)

  beforeAll(() => {
    runNpmInstall(DIR)
    execa.sync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', tsJestBundle], {
      cwd: DIR,
    })
  })

  executeTest(`${AST_TRANSFORMERS_DIR_NAME}/${HOIST_JEST_DIR_NAME}`)
})

describe('transformer-in-ts', () => {
  const DIR = path.join(__dirname, '..', AST_TRANSFORMERS_DIR_NAME, 'transformer-in-ts')

  beforeAll(() => {
    runNpmInstall(DIR)
  })

  test(`successfully runs the tests inside ${DIR}`, () => {
    const { json } = runWithJson(DIR)

    expect(json.success).toBe(true)
  })
})
