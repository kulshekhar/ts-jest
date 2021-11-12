import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const DIR_NAME = 'transform-tsx'

describe('transform-tsx', () => {
  beforeAll(() => {
    runNpmInstall(path.join(__dirname, '..', DIR_NAME))
  })

  test(`successfully runs the tests inside ${DIR_NAME} with isolatedModules: false`, () => {
    const { json } = runWithJson(DIR_NAME)

    expect(json.success).toBe(true)
  })

  test(`successfully runs the tests inside ${DIR_NAME} with isolatedModules: true`, () => {
    const { json } = runWithJson(DIR_NAME, ['-c=jest-isolated.config.js'])

    expect(json.success).toBe(true)
  })
})
