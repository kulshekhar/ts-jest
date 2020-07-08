import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With diagnostics throw', () => {
  const testCase = configureTestCase('diagnostics', {
    noCache: true, // warnings shown only on first compilation
  })

  testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result).toMatchSnapshot()
    })
  })
})

describe('With diagnostics warn only', () => {
  const testCase = configureTestCase('diagnostics', {
    tsJestConfig: {
      diagnostics: { warnOnly: true },
    },
    noCache: true, // warnings shown only on first compilation
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
