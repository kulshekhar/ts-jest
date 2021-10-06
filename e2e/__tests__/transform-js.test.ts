import path from 'path'

import runJest, { json as runWithJson } from '../run-jest'
import { extractSortedSummary, runNpmInstall } from '../utils'

const DIR = path.resolve(__dirname, '..', 'transform-js')

beforeAll(() => {
  runNpmInstall(DIR)
})

test('transpile js files without Babel', () => {
  const result = runJest(DIR, ['--no-cache'], {
    stripAnsi: true,
  })

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})

test('transpile js files with Babel', () => {
  const { json } = runWithJson(DIR, ['--no-cache', '-c=jest-babel.config.js'])

  expect(json.success).toBe(true)
  expect(json.numTotalTestSuites).toBeGreaterThanOrEqual(2)
})
