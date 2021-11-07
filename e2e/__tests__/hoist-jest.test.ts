import * as path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

const DIR = path.resolve(__dirname, '..', 'hoist-jest')

beforeEach(() => {
  runNpmInstall(DIR)
})

test('successfully runs the tests inside `hoist-jest/` with isolatedModules: false', () => {
  const { json } = runWithJson(DIR)

  expect(json.success).toBe(true)
})

test('successfully runs the tests inside `hoist-jest/` with isolatedModules true', () => {
  const { json } = runWithJson(DIR, ['-c=jest-isolated.config.js'])

  expect(json.success).toBe(true)
})
