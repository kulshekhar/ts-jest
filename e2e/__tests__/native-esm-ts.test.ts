import path from 'path'

import { json as runWithJson } from '../run-jest'
import { runNpmInstall } from '../utils'

beforeAll(() => {
  runNpmInstall(path.join(__dirname, '..', 'native-esm-ts'))
})

test('runs TS test with native ESM', () => {
  const { exitCode, json } = runWithJson('native-esm-ts', [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  })

  expect(exitCode).toBe(0)
  expect(json.numTotalTests).toBe(6)
  expect(json.numPassedTests).toBe(6)
})
