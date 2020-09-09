import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Hoisting', () => {
  const testCase = configureTestCase('hoisting', {
    writeIo: true,
    jestConfig: {
      automock: true,
    },
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot(testLabel)
    })
  })
})
