import { LogContexts, LogLevels } from 'bs-logger'
import { existsSync } from 'fs'

import { PackageSets, allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('ts-jest logging', () => {
  describe('with unsupported version test', () => {
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
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          .map(e => result.normalize(`[level:${e.context[LogContexts.logLevel]}] ${e.message}`))
        expect(filteredEntries).toMatchSnapshot()
      })
    })
  })

  /**
   * Since we only run e2e for node 12 so we need this if here. We follow latest LTS Node version so once latest LTS version
   * changes, we also need to change this test.
   */
  if (process.version.startsWith('v12')) {
    describe('typescript target is higher than es2019 for NodeJs 12', () => {
      const tsTarget = 'es2020'
      const testCase = configureTestCase('simple', {
        env: { TS_JEST_LOG: 'ts-jest.log' },
        noCache: true,
        tsJestConfig: {
          tsConfig: {
            target: 'es2020' as any
          }
        }
      })

      testCase.runWithTemplates([PackageSets.default], 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
          const filteredEntries = result.logFileEntries
            // keep only debug and above
            .filter(m => (m.context[LogContexts.logLevel] || 0) === LogLevels.warn)
            // simplify entries
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            .map(e => result.normalize(`[level:${e.context[LogContexts.logLevel]}] ${e.message}`))
          // toEqual resolves in strange error so toContain is workaround
          expect(filteredEntries[0]).toContain('[level:40] There is a mismatch between your NodeJs version ' +
            `${process.version} and your TypeScript target ${tsTarget}. This might lead to some unexpected errors when running tests with ` +
            '`ts-jest`. To fix this, you can check https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping')
        })
      })
    })
  }
})
