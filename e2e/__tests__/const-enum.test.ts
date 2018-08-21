import { configureTestCase } from '../__helpers__/test-case'
import { allValidPackageSets } from '../__helpers__/templates'

describe('Const enum', () => {
  const testCase = configureTestCase('const-enum', {
    tsJestConfig: { typeCheck: true },
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
    })
  })
})
