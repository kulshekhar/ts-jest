import { allPackageSetsWithProgram, allPackageSetsWithoutProgram } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('With compilerHost enabled and incremental disabled', () => {
  const testCase = configureTestCase('compiler-host', {
    tsJestConfig: { compilerHost: true, incremental: false, diagnostics: { warnOnly: true } },
    noCache: true,
  })

  testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      // tslint:disable-next-line:no-console
      console.log = jest.fn()
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })

  testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result).toMatchSnapshot()
    })
  })
})

describe('With compilerHost enabled and incremental enabled', () => {
  const testCase = configureTestCase('compiler-host', {
    tsJestConfig: { compilerHost: true, incremental: false, diagnostics: { warnOnly: true } },
    noCache: true,
  })

  testCase.runWithTemplates(allPackageSetsWithProgram, 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      // tslint:disable-next-line:no-console
      console.log = jest.fn()
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })

  testCase.runWithTemplates(allPackageSetsWithoutProgram, 1, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(1)
      expect(result).toMatchSnapshot()
    })
  })
})
