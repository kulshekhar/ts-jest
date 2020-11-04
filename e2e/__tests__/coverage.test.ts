import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Code coverage', () => {
  const testCase = configureTestCase('simple', {
    jestConfig: { collectCoverage: true },
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()

      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
