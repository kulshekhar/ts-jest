import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

const testCase = configureTestCase('simple', {
  jestConfig: { collectCoverage: true },
})

testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { templateName }) => {
  describe(`using template "${templateName}"`, () => {
    const result = runTest()

    it(`should report coverages`, () => {
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})
