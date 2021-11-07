import runJest from '../run-jest'
import { extractSortedSummary } from '../utils'

test('run tests with `isolatedModules: false`', () => {
  const result = runJest('source-map')

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})

test('run tests with `isolatedModules: true`', () => {
  const result = runJest('source-map', ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})
