import path from 'path'

import execa from 'execa'

import { json as runWithJson } from '../run-jest'
import { tsJestBundle } from '../utils'

const DIR_NAME = 'test-utils'

beforeAll(() => {
  execa.sync('npm', ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', tsJestBundle], {
    cwd: path.join(__dirname, '..', DIR_NAME),
  })
})

test(`successfully runs the tests inside ${DIR_NAME}`, () => {
  process.env.DISABLE_MOCKED_WARNING = 'true'
  const { json } = runWithJson(DIR_NAME, undefined, {
    stripAnsi: true,
  })

  expect(json.success).toBe(true)

  delete process.env.DISABLE_MOCKED_WARNING
})
