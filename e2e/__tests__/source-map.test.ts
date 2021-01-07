import { join } from 'path'

import type { TsJestConfig } from '../../src/types'
import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

function runSourceMapTests(tsJestConfig: Partial<TsJestConfig> | any) {
  const testCase = configureTestCase('source-maps', {
    writeIo: true,
    // TS5023 - unrecognized compiler option
    // TS7027 - unreachable code
    tsJestConfig,
  })

  testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { templateName }) => {
    describe(`using template "${templateName}"`, () => {
      const result = runTest()
      // TODO: Refactor e2e tests to have more stable tests.
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip(`should report correct line numbers`, () => {
        expect(result.status).toBe(1)
        expect(result).toMatchSnapshot()
      })

      // when there are some issues with debugging, it's usually because source maps are not inlined
      // and the debugger cannot find the line where to go
      it(`should have the source maps comment`, () => {
        const io = result.ioFor('main.ts')
        const filePath = join(result.cwd, 'main.ts')
        expect(io).toMatchSnapshot()
        // we could keep only the snapshot testing, but this ensure fixed stuff are the same over versions
        expect(io.outputSourceMaps).toMatchObject({
          names: [],
          sources: [filePath],
          sourcesContent: [io.inputCode],
          version: 3,
        })
      })
    })
  })
}

const BASE_CONFIG = { diagnostics: { ignoreCodes: [5023, 7027], pretty: true, throws: false } }

describe('Source map', () => {
  describe('without tsconfig mapRoot', () => {
    runSourceMapTests(BASE_CONFIG)
  })

  describe('with tsconfig mapRoot', () => {
    runSourceMapTests({
      ...BASE_CONFIG,
      tsconfig: {
        mapRoot: './'
      }
    })
  })
})
