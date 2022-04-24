import runJest from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR_NAME = 'enum'

test(`partial successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: false'`, () => {
  const result = runJest(DIR_NAME)

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})

test(`partial successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: true'`, () => {
  const result = runJest(DIR_NAME, ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})
