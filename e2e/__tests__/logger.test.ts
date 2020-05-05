import { LogContexts, LogLevels } from 'bs-logger'
import { existsSync } from 'fs'

import { PackageSets, allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

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

describe('TS_JEST_LOG', () => {
  const testCase = configureTestCase('simple', {
    env: { TS_JEST_LOG: 'ts-jest.log' },
    noCache: true,
  })

  testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { templateName }) => {
    it(`should pass and create log file when using template "${templateName}"`, () => {
      const result = runTest()
      expect(result.status).toBe(0)
      expect(existsSync(result.logFilePath)).toBe(true)
      const filteredEntries = result.logFileEntries
        // keep only debug and above
        .filter(m => (m.context[LogContexts.logLevel] || 0) >= LogLevels.debug)
        // simplify entires
        .map(e => result.normalize(`[level:${e.context[LogContexts.logLevel]}] ${e.message}`))
      expect(filteredEntries).toMatchSnapshot()
    })
  })
})
