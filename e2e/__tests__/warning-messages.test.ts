import { configureTestCase } from '../__helpers__/test-case'
import { PackageSets } from '../__helpers__/templates'

describe('With unsupported version test', () => {
  const testCase = configureTestCase('simple')

  testCase.runWithTemplates([PackageSets.unsupportedVersion], 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
