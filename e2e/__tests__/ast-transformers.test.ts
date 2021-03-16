import { LogContexts, LogLevels } from 'bs-logger'

import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('AST transformers', () => {
  describe('hoisting', () => {
    const testCase = configureTestCase('ast-transformers/hoisting', {
      jestConfig: {
        testEnvironment: 'node',
        automock: true,
      },
    })

    testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
      it(testLabel, () => {
        const result = runTest()
        expect(result.status).toBe(0)
      })
    })
  })

  describe('path mapping', () => {
    const tsJestConfig = {
      tsconfig: {
        baseUrl: '.',
        paths: {
          '@share/*': ['share/*']
        }
      },
      astTransformers: {
        before: [
          'ts-jest/transformers/path-mapping'
        ],
      },
    }

    describe('without rootDirs', () => {
      const testCase = configureTestCase('ast-transformers/path-mapping', {
        env: { TS_JEST_LOG: 'ts-jest.log' },
        tsJestConfig,
      })

      testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
        })
      })
    })

    describe('with rootDirs', () => {
      const testCase = configureTestCase('ast-transformers/path-mapping', {
        tsJestConfig: {
          ...tsJestConfig,
          tsconfig: {
            ...tsJestConfig.tsconfig,
            rootDirs: ['./'],
          },
        },
      })

      testCase.runWithTemplates(allValidPackageSets, 0, (runTest, { testLabel }) => {
        it(testLabel, () => {
          const result = runTest()
          expect(result.status).toBe(0)
        })
      })
    })
  })

  describe('with extra options', () => {
    const testCase = configureTestCase('ast-transformers/with-extra-options', {
      env: { TS_JEST_LOG: 'ts-jest.log' },
      noCache: true, // no cache is required when testing against logging otherwise other tests will clear logging
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
