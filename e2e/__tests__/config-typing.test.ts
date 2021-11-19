import path from 'path'

import execa from 'execa'

import { json as runWithJson } from '../run-jest'
import { tsJestBundle } from '../utils'

const DIR_NAME = 'config-typing'

beforeAll(() => {
  execa.sync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', tsJestBundle], {
    cwd: path.join(__dirname, '..', DIR_NAME),
  })
})

test(`successfully runs the tests inside ${DIR_NAME}`, () => {
  const { json } = runWithJson(DIR_NAME)

  expect(json.success).toBe(true)
})
