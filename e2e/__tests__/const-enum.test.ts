import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Const enum', () => {
  const testCase = configureTestCase('const-enum')

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
    })
  })
})
