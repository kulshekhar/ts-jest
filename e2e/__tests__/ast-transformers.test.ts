import path from 'path'

import execa from 'execa'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const { createBundle } = require('../../scripts/lib/bundle')

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

describe('path-mapping', () => {
  executeTest(`${AST_TRANSFORMERS_DIR_NAME}/path-mapping`)
})

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
  const NON_TS_FACTORY_DIR_NAME = 'non-ts-factory'
  const TS_FACTORY_DIR_NAME = 'ts-factory'

  describe('non-ts-factory', () => {
    const DIR = path.resolve(__dirname, '..', AST_TRANSFORMERS_DIR_NAME, 'hoist-jest', NON_TS_FACTORY_DIR_NAME)

    beforeAll(() => {
      runNpmInstall(DIR)
      const bundle = createBundle()
      execa.sync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle], {
        cwd: DIR,
      })
    })

    executeTest(`${AST_TRANSFORMERS_DIR_NAME}/hoist-jest/${NON_TS_FACTORY_DIR_NAME}`)
  })

  describe('ts-factory', () => {
    beforeAll(() => {
      runNpmInstall(path.resolve(__dirname, '..', AST_TRANSFORMERS_DIR_NAME, 'hoist-jest', TS_FACTORY_DIR_NAME))
    })

    executeTest(`${AST_TRANSFORMERS_DIR_NAME}/hoist-jest/${TS_FACTORY_DIR_NAME}`)
  })
})

describe('transformer-in-ts', () => {
  const TRANSFORMER_IN_TS_DIR_NAME = `${AST_TRANSFORMERS_DIR_NAME}/transformer-in-ts`

  test(`successfully runs the tests inside ${TRANSFORMER_IN_TS_DIR_NAME}`, () => {
    const { json } = runWithJson(TRANSFORMER_IN_TS_DIR_NAME)

    expect(json.success).toBe(true)
  })
})
