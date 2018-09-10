import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With diagnostics, first throws', () => {
  const testCase = configureTestCase('diagnostics')

  testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result).toMatchSnapshot()
    })
  })
})

describe('With diagnostics, warn only', () => {
  const testCase = configureTestCase('diagnostics', { tsJestConfig: { diagnostics: { warnOnly: true } } })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
