import { configureTestCase } from '../__helpers__/test-case'
import { allValidPackageSets } from '../__helpers__/templates'

describe('Simple test', () => {
  const testCase = configureTestCase('simple')

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
