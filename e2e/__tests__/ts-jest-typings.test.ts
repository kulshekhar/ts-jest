import { PackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('ts-jest utils', () => {
  const testCase = configureTestCase('typings')

  testCase.runWithTemplates([PackageSets.default], 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
    })
  })
})
