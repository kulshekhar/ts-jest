import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'
import { normalize } from 'path'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

import * as compilerUtils from './compiler-utils'

const logTarget = logTargetMock()

describe('Language service', () => {
  beforeEach(() => {
    logTarget.clear()
  })

  it('should use the cache', () => {
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: { tsConfig: false },
    })
    const source = 'console.log("hello")'
    const fileName = 'test-cache.ts'

    writeFileSync(fileName, source, 'utf8')

    logTarget.clear()
    const compiled1 = compiler.compile(source, fileName)

    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache miss
      ",
        "[level:20] compileFn(): compiling using language service
      ",
        "[level:20] updateMemoryCache(): update memory cache for language service
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] compileFn(): computing diagnostics for test-cache.ts using language service
      ",
        "[level:20] readThrough(): writing caches
      ",
      ]
    `)

    logTarget.clear()
    const compiled2 = compiler.compile(source, fileName)

    expect(logTarget.lines).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache hit
      ",
      ]
    `)

    expect(new ProcessedSource(compiled1, fileName)).toMatchSnapshot()
    expect(compiled2).toBe(compiled1)

    removeSync(fileName)
  })

  it('should get compile result from referenced project when there is a built reference project', () => {
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: { tsConfig: false },
    })
    const source = 'console.log("hello")'
    const fileName = 'test-reference-project.ts'
    const getAndCacheProjectReferenceSpy = jest
      .spyOn(compilerUtils, 'getAndCacheProjectReference')
      .mockReturnValueOnce({} as any)
    jest
      .spyOn(compilerUtils, 'getCompileResultFromReferencedProject')
      .mockImplementationOnce(() => [
        source,
        '{"version":3,"file":"test-reference-project.js","sourceRoot":"","sources":["test-reference-project.ts"],"names":[],"mappings":"AAAA,OAAO,CAAC,GAAG,CAAC,OAAO,CAAC,CAAA","sourcesContent":["console.log(\\"hello\\")"]}',
      ])
    writeFileSync(fileName, source, 'utf8')

    compiler.compile(source, fileName)

    expect(getAndCacheProjectReferenceSpy).toHaveBeenCalled()
    expect(compilerUtils.getCompileResultFromReferencedProject).toHaveBeenCalled()

    jest.restoreAllMocks()
    removeSync(fileName)
  })

  it('should get compile result from language service when there is no referenced project', () => {
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: { tsConfig: false },
    })
    const source = 'console.log("hello")'
    const fileName = 'test-no-reference-project.ts'
    const getAndCacheProjectReferenceSpy = jest
      .spyOn(compilerUtils, 'getAndCacheProjectReference')
      .mockReturnValueOnce(undefined)
    jest.spyOn(compilerUtils, 'getCompileResultFromReferencedProject')
    writeFileSync(fileName, source, 'utf8')

    compiler.compile(source, fileName)

    expect(getAndCacheProjectReferenceSpy).toHaveBeenCalled()
    expect(compilerUtils.getCompileResultFromReferencedProject).not.toHaveBeenCalled()

    jest.restoreAllMocks()
    removeSync(fileName)
  })

  it('should cache resolved modules for test file with testMatchPatterns from jest config when match', () => {
    // tslint:disable-next-line:no-empty
    const spy = jest.spyOn(compilerUtils, 'cacheResolvedModules').mockImplementationOnce(() => {})
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testRegex: [/.*\.(spec|test)\.[jt]sx?$/] as any[] },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/main.spec.ts'
    const source = JSON.stringify(require('../__mocks__/main.spec'))

    compiler.compile(source, fileName)

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toEqual(normalize(fileName))
    expect(spy.mock.calls[0][1]).toEqual(source)

    spy.mockRestore()
  })

  it(`shouldn't cache resolved modules for test file with testMatchPatterns from jest config when not match`, () => {
    // tslint:disable-next-line:no-empty
    jest.spyOn(compilerUtils, 'cacheResolvedModules').mockImplementationOnce(() => {})
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp, testRegex: [/.*\.(foo|bar)\.[jt]sx?$/] as any[] },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/main.spec.ts'
    const source = JSON.stringify(require('../__mocks__/main.spec'))

    compiler.compile(source, fileName)

    expect(compilerUtils.cacheResolvedModules).not.toHaveBeenCalled()
  })

  it('should compile js file for allowJs true with outDir', () => {
    const fileName = `test-allow-js-with-outDir.js`
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
    const fileName = `test-allow-js-no-outDir.js`
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
