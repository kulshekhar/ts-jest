import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

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
  executeTest('ast-transformers/path-mapping')
})

const TRANSFORM_OPT_DIR_NAME = 'transformer-options'

describe('transformer-options', () => {
  beforeAll(() => {
    runNpmInstall(path.join(__dirname, '..', 'ast-transformers', TRANSFORM_OPT_DIR_NAME))
  })

  executeTest(`ast-transformers/${TRANSFORM_OPT_DIR_NAME}`)
})
