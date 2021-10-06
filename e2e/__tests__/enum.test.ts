import runJest from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR = 'enum'

test('partial successfully runs the tests inside `enum/` with `isolatedModules: true`', () => {
  const result = runJest(DIR)

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})

test('partial successfully runs the tests inside `enum/` with `isolatedModules: false`', () => {
  const result = runJest(DIR, ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})
