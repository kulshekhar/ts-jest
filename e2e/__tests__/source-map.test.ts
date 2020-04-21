import { join } from 'path'

import { allValidPackageSets } from '../__helpers__/templates'
import { configureTestCase } from '../__helpers__/test-case'

describe('Source map', () => {
  const testCase = configureTestCase('source-maps', {
    writeIo: true,
    // TS5023 - unrecognized compiler option
    // TS7027 - unreachable code
    tsJestConfig: { diagnostics: { ignoreCodes: [5023, 7027] } },
  })

  testCase.runWithTemplates(allValidPackageSets, 1, (runTest, { templateName }) => {
    describe(`using template "${templateName}"`, () => {
      const result = runTest()
      it(`should report correct line numbers`, () => {
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
})
