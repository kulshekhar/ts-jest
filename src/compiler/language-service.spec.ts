import { LogLevels } from 'bs-logger'
import { readFileSync } from 'fs'
import { removeSync } from 'fs-extra'
import { join } from 'path'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

describe('Language service', () => {
  beforeEach(() => {
    logTarget.clear()
  })

  describe('allowJs option', () => {
    const fileName = 'test-allow-js.js'
    const source = 'export default 42'

    it('should compile js file for allowJs true with outDir', () => {
      const compiler = makeCompiler({
        tsJestConfig: { tsConfig: { allowJs: true, outDir: '$$foo$$' } },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })

    it('should compile js file for allowJs true without outDir', () => {
      const compiler = makeCompiler({
        tsJestConfig: { tsConfig: { allowJs: true } },
      })
      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })
  })

  describe('jsx option', () => {
    const fileName = 'test-jsx.tsx'
    const source = `
        const App = () => {
          return <>Test</>
        }
      `

    it('should compile tsx file for jsx preserve', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          tsConfig: {
            jsx: 'preserve' as any,
          },
        },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })

    it('should compile tsx file for other jsx options', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          tsConfig: {
            jsx: 'react' as any,
          },
        },
      })
      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
    })
  })

  describe('source maps', () => {
    const source = 'const gsm = (v: number) => v\nconst h: number = gsm(5)'
    const fileName = 'test-source-map.ts'

    it('should have correct source maps without mapRoot', () => {
      const compiler = makeCompiler({ tsJestConfig: { tsConfig: require.resolve('../../tsconfig.spec.json') } })
      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
        file: fileName,
        sources: [fileName],
        sourcesContent: [source],
      })
    })

    it('should have correct source maps with mapRoot', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          tsConfig: {
            mapRoot: './',
          },
        },
      })
      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
        file: fileName,
        sources: [fileName],
        sourcesContent: [source],
      })
    })
  })

  describe('diagnostics', () => {
    const importedFileName = require.resolve('../__mocks__/thing.ts')
    const importedFileContent = readFileSync(importedFileName, 'utf-8')
    const baseTsJestConfig = { tsConfig: require.resolve('../../tsconfig.spec.json') }

    it(`should report diagnostics for imported modules as well as test files which use imported modules with cache`, async () => {
      const testFileName = require.resolve('../__mocks__/thing1.spec.ts')
      const testFileContent = readFileSync(testFileName, 'utf-8')
      const cacheDir = join(process.cwd(), 'tmp')
      /**
       * Run the 1st compilation with Promise resolve setTimeout to stimulate 2 different test runs to test cached
       * resolved modules
       */
      async function firstCompile() {
        return new Promise((resolve) => {
          const compiler1 = makeCompiler({
            jestConfig: {
              cache: true,
              cacheDirectory: cacheDir,
            },
            tsJestConfig: baseTsJestConfig,
          })

          logTarget.clear()
          compiler1.compile(testFileContent, testFileName)

          // probably 300ms is enough to stimulate 2 separated runs after each other
          setTimeout(() => resolve(), 300)
        })
      }

      await firstCompile()

      const compiler2 = makeCompiler({
        jestConfig: {
          cache: true,
          cacheDirectory: cacheDir,
        },
        tsJestConfig: baseTsJestConfig,
      })
      logTarget.clear()

      compiler2.compile(importedFileContent, importedFileName)

      expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchSnapshot()

      removeSync(cacheDir)
    })

    it(`should only report diagnostics for imported modules but not test files without cache`, () => {
      const testFileName = require.resolve('../__mocks__/thing1.spec.ts')
      const testFileContent = readFileSync(testFileName, 'utf-8')
      const compiler1 = makeCompiler({
        tsJestConfig: baseTsJestConfig,
      })
      logTarget.clear()
      compiler1.compile(testFileContent, testFileName)

      const compiler2 = makeCompiler({
        tsJestConfig: baseTsJestConfig,
      })
      logTarget.clear()

      compiler2.compile(importedFileContent, importedFileName)

      expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchSnapshot()
    })

    it(`shouldn't report diagnostics for test file name that has been type checked before`, () => {
      const testFileName = require.resolve('../__mocks__/thing1.spec.ts')
      const testFileContent = readFileSync(testFileName, 'utf-8')
      const compiler1 = makeCompiler({
        tsJestConfig: baseTsJestConfig,
      })
      logTarget.clear()

      compiler1.compile(testFileContent, testFileName)
      compiler1.compile(importedFileContent, importedFileName)

      expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchSnapshot()
    })

    it(`shouldn't report diagnostics when file name doesn't match diagnostic file pattern`, () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          diagnostics: { pathRegex: 'foo.spec.ts' },
        },
      })

      expect(() => compiler.compile(importedFileContent, importedFileName)).not.toThrowError()
    })

    it(`shouldn't report diagnostic when processing file isn't used by any test files`, () => {
      const compiler = makeCompiler({
        tsJestConfig: baseTsJestConfig,
      })
      logTarget.clear()

      compiler.compile(importedFileContent, 'foo.ts')

      expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchSnapshot()
    })

    it('should throw error when cannot compile', () => {
      const fileName = 'test-cannot-compile.d.ts'
      const source = `
        interface Foo {
          a: string
        }
      `
      const compiler = makeCompiler({
        tsJestConfig: baseTsJestConfig,
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })
  })
})
