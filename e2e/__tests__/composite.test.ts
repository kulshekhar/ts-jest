import { PackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('with composite enabled', () => {
  const testCase = configureTestCase('composite')

  testCase.runWithTemplates([PackageSets.default], 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
    })
  })
})
