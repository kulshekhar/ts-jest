import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

describe('language service', () => {
  const baseTsJestConfig = {
    experimental: true,
  }

  beforeEach(() => {
    logTarget.clear()
  })

  it('should use the cache', () => {
    const tmp = tempDir('compiler'),
      compiler = makeCompiler({
        jestConfig: { cache: true, cacheDirectory: tmp },
        tsJestConfig: { ...baseTsJestConfig, tsConfig: false },
      }),
      source = 'console.log("hello")'

    logTarget.clear()
    const compiled1 = compiler.compile(source, __filename)

    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache miss
      ",
        "[level:20] updateMemoryCache() for language service
      ",
        "[level:20] compiler rebuilt Program instance when getting output
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] getOutput(): computing diagnostics for language service
      ",
        "[level:20] invariant: Is service.getProject() identical before and after getting emit output and diagnostics? (should always be true)  true
      ",
        "[level:20] readThrough(): writing caches
      ",
      ]
    `)

    logTarget.clear()
    const compiled2 = compiler.compile(source, __filename)

    expect(logTarget.lines).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache hit
      ",
      ]
    `)

    expect(new ProcessedSource(compiled1, __filename)).toMatchSnapshot()
    expect(compiled2).toBe(compiled1)
  })

  it('should compile js file for allowJs true', () => {
    const fileName = `${__filename}.test.js`,
      compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: '$$ts-jest$$' } },
      }),
      source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should get correct type info', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } }),
      source = `
        type MyType {
          /** the prop 1! */
          p1: boolean
        }
        const val: MyType = {} as any
        console.log(val.p1/* <== that */)
        `

    const ti = compiler.getTypeInfo(source, __filename, source.indexOf('/* <== that */') - 1)

    // before TS 3.1 the comment had an extra tailing space
    ti.comment = ti.comment.trim()
    expect(ti).toEqual({
      comment: 'the prop 1!',
      name: '(property) p1: boolean',
    })
  })

  it('should have correct source maps', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } }),
      source = 'const f = (v: number) => v\nconst t: number = f(5)'

    const compiled = compiler.compile(source, __filename)

    expect(new ProcessedSource(compiled, __filename).outputSourceMaps).toMatchObject({
      file: __filename,
      sources: [__filename],
      sourcesContent: [source],
    })
  })

  it('should report diagnostics related to typings', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should report diagnostics with pathRegex config matches file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'foo.ts' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should report diagnostics with pathRegex config does not match file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: '/bar.ts/' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).not.toThrowError()
  })
})
