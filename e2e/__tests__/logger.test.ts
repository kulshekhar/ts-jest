import { configureTestCase } from '../__helpers__/test-case'
import { PackageSets, allValidPackageSets } from '../__helpers__/templates'
import { existsSync } from 'fs'

describe('With unsupported version test', () => {
  const testCase = configureTestCase('simple')

  testCase.runWithTemplates([PackageSets.unsupportedVersion], 0, (runTest, { testLabel }) => {
    it(testLabel, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(result).toMatchSnapshot()
    })
  })
})

describe('TS_JEST_DEBUG', () => {
  const testCase = configureTestCase('simple', { env: { TS_JEST_DEBUG: 'true' } })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { templateName }) => {
    it(`should pass and create log file when using tempalte "${templateName}"`, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(existsSync(result.logFilePath))
      expect(result.normalizedLogFileContent).toMatchSnapshot()
    })
  })
})
