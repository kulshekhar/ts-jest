import runJest from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR_NAME = 'source-map'

test(`successfully run the tests inside ${DIR_NAME} with 'isolatedModules: false'`, () => {
  const result = runJest(DIR_NAME)

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})

test(`successfully run the tests inside ${DIR_NAME} with 'isolatedModules: true'`, () => {
  const result = runJest(DIR_NAME, ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})
