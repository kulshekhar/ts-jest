import { configureTestCase } from '../__helpers__/test-case'
import { allValidPackageSets } from '../__helpers__/templates'

describe('With type checking', () => {
  const testCase = configureTestCase('type-checking', {
    tsJestConfig: { typeCheck: true },
  })

  testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result).toMatchSnapshot()
    })
  })
})

describe('Without type checking', () => {
  const testCase = configureTestCase('type-checking', {
    tsJestConfig: { typeCheck: false },
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
