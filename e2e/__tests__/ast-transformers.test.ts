import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

describe('path-mapping', () => {
  const DIR = 'ast-transformers/path-mapping'

  test(`successfully runs the tests inside ${DIR} with isolatedModules: false`, () => {
    const { json } = runWithJson(DIR)

    expect(json.success).toBe(true)
  })

  test(`successfully runs the tests inside ${DIR} with isolatedModules: true`, () => {
    const { json } = runWithJson(DIR, ['-c=jest-isolated.config.js'])

    expect(json.success).toBe(true)
  })
})

describe('transformer options', () => {
  const DIR = path.join(__dirname, '..', 'ast-transformers', 'transformer-options')

  beforeEach(() => {
    runNpmInstall(DIR)
  })

  test('successfully runs the tests inside `ast-transformer/transformer-options` with isolatedModules: false', () => {
    const { json } = runWithJson(DIR)

    expect(json.success).toBe(true)
  })

  test('successfully runs the tests inside `ast-transformer/transformer-options` with isolatedModules: true', () => {
    const { json } = runWithJson(DIR, ['-c=jest-isolated.config.js'])

    expect(json.success).toBe(true)
  })
})
