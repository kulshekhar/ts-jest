import { LogLevels } from 'bs-logger'
import { readFileSync } from 'fs'
import { removeSync, writeFileSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'
import { normalizeSlashes } from '../util/normalize-slashes'

import * as compilerUtils from './compiler-utils'

const logTarget = logTargetMock()

describe('Language service', () => {
  beforeEach(() => {
    logTarget.clear()
  })

  it('should cache resolved modules for test file with testMatchPatterns from jest config when match', () => {
    const spy = jest.spyOn(compilerUtils, 'cacheResolvedModules').mockImplementationOnce(() => {})
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testRegex: [/.*\.(spec|test)\.[jt]sx?$/] as any[] },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/unchanged-modules/main.spec.ts'
    const source = `import { Thing } from './main'

export const thing: Thing = { a: 1 }`

    compiler.compile(source, fileName)

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toEqual(normalizeSlashes(fileName))
    expect(spy.mock.calls[0][1]).toEqual(source)

    spy.mockRestore()
  })

  it("shouldn't cache resolved modules for test file with testMatchPatterns from jest config when not match", () => {
    jest.spyOn(compilerUtils, 'cacheResolvedModules').mockImplementationOnce(() => {})
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testRegex: [/.*\.(foo|bar)\.[jt]sx?$/] as any[] },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/unchanged-modules/main.spec.ts'
    const source = `import { Thing } from './main'

export const thing: Thing = { a: 1 }`

    compiler.compile(source, fileName)

    expect(compilerUtils.cacheResolvedModules).not.toHaveBeenCalled()
  })

  it('should compile js file for allowJs true with outDir', () => {
    const fileName = 'test-allow-js-with-outDir.js'
    const compiler = makeCompiler({
      tsJestConfig: { tsConfig: { allowJs: true, outDir: '$$foo$$' } },
    })
    const source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile js file for allowJs true without outDir', () => {
    const fileName = 'test-allow-js-no-outDir.js'
    const compiler = makeCompiler({
      tsJestConfig: { tsConfig: { allowJs: true } },
    })
    const source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for jsx preserve', () => {
    const fileName = 'test-jsx-preserve.tsx'
    const compiler = makeCompiler({
      tsJestConfig: {
        tsConfig: {
          jsx: 'preserve' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `
    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for other jsx options', () => {
    const fileName = 'test-jsx-options.tsx'
    const compiler = makeCompiler({
      tsJestConfig: {
        tsConfig: {
          jsx: 'react' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `
    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should have correct source maps', () => {
    const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } })
    const source = 'const gsm = (v: number) => v\nconst h: number = gsm(5)'
    const fileName = 'test-source-map.ts'
    writeFileSync(fileName, source, 'utf8')

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
      file: fileName,
      sources: [fileName],
      sourcesContent: [source],
    })

    removeSync(fileName)
  })

  it('should not do type check for the test file which is already finished type checking before', () => {
    const tmp = tempDir('compiler')
    const testFileName = 'src/__mocks__/unchanged-modules/main.spec.ts'
    const testFileSrc = readFileSync(testFileName, 'utf-8')
    const importedModuleSrc = readFileSync('src/__mocks__/unchanged-modules/main.ts', 'utf-8')

    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testMatch: ['src/__mocks__/unchanged-modules/*.spec.ts'] },
      tsJestConfig: { tsConfig: false },
    })

    compiler.compile(testFileSrc, testFileName)
    logTarget.clear()
    compiler.compile(importedModuleSrc, require.resolve('../__mocks__/unchanged-modules/main.ts'))

    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] compileAndCacheResult(): get compile output
      ",
        "[level:20] compileFn(): compiling using language service
      ",
        "[level:20] updateMemoryCache(): update memory cache for language service
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] compileFn(): computing diagnostics using language service
      ",
      ]
    `)
  })

  it('should do type check for the test file when imported module has changed', () => {
    const tmp = tempDir('compiler')
    const testFileName = 'src/__mocks__/changed-modules/main.spec.ts'
    const testFileSrc = readFileSync(testFileName, 'utf-8')
    const importedModulePath = 'src/__mocks__/changed-modules/main.ts'
    const importedModuleSrc = readFileSync(importedModulePath, 'utf-8')
    const newImportedModuleSrc = 'export interface Thing { a: number, b: number }'

    const compiler1 = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testMatch: ['src/__mocks__/changed-modules/*.spec.ts'] },
      tsJestConfig: { tsConfig: false },
    })
    compiler1.compile(testFileSrc, testFileName)

    writeFileSync(importedModulePath, 'export interface Thing { a: number, b: number }')
    const compiler2 = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testMatch: ['src/__mocks__/changed-modules/*.spec.ts'] },
      tsJestConfig: { tsConfig: false },
    })

    expect(() =>
      compiler2.compile(newImportedModuleSrc, require.resolve('../__mocks__/changed-modules/main.ts')),
    ).toThrowErrorMatchingSnapshot()

    writeFileSync(importedModulePath, importedModuleSrc)
  })

  it('should report diagnostics related to typings with pathRegex config matches file name', () => {
    const fileName = 'test-match-regex-diagnostics.ts'
    const source = `
const g = (v: number) => v
const x: string = g(5)
`
    const compiler = makeCompiler({
      tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: fileName } },
    })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()

    removeSync(fileName)
  })

  it('should not report diagnostics related to typings with pathRegex config does not match file name', () => {
    const fileName = 'test-non-match-regex-diagnostics.ts'
    const source = `
const f = (v: number) => v
const t: string = f(5)
`
    const compiler = makeCompiler({
      tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: 'bar.ts' } },
    })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).not.toThrowError()

    removeSync(fileName)
  })

  it('should throw error when cannot compile', () => {
    const fileName = 'test-cannot-compile.d.ts'
    const source = `
        interface Foo {
          a: string
        }
      `
    const compiler = makeCompiler({
      tsJestConfig: { tsConfig: false },
    })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()

    removeSync(fileName)
  })
})
