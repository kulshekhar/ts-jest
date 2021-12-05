import runJest, { json as runWithJson } from '../run-jest'
import { extractSortedSummary } from '../utils'

const DIR_NAME = 'const-enum'

test(`successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: false'`, () => {
  const { json } = runWithJson(DIR_NAME)

  expect(json.success).toBe(true)
})

test(`partial successfully runs the tests inside ${DIR_NAME} with 'isolatedModules: true'`, () => {
  const result = runJest(DIR_NAME, ['-c=jest-isolated.config.js'])

  expect(extractSortedSummary(result.stderr).rest).toMatchSnapshot()
})
