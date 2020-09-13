import { configureTestCase } from '../__helpers__/test-case'
import { allValidPackageSets } from '../__helpers__/templates'
import { existsSync } from "fs"
import { LogContexts, LogLevels } from 'bs-logger'

describe('AST transformers', () => {
  describe('with extra options', () => {
    const testCase = configureTestCase('ast-transformers/with-extra-options', {
      env: { TS_JEST_LOG: 'ts-jest.log' },
      tsJestConfig: {
        astTransformers: {
          before: [{
            path: require.resolve('../__cases__/ast-transformers/with-extra-options/foo'),
            options: {
              foo: 'bar',
            },
          }],
        },
      },
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
        expect(existsSync(result.logFilePath)).toBe(true)
        const filteredEntries = result.logFileEntries
          // keep only debug and above
          .filter(m => (m.context[LogContexts.logLevel] || 0) >= LogLevels.debug)
          // simplify entries
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          .map(e => result.normalize(`[level:${e.context[LogContexts.logLevel]}] ${e.message}`))
          .filter(logging => logging.includes('Dummy transformer with extra options'))
        expect(filteredEntries).toMatchSnapshot()
      })
    })
  })
})
