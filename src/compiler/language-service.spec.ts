import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

describe('language service', () => {
  beforeEach(() => {
    logTarget.clear()
  })

  it('should use the cache', () => {
    const tmp = tempDir('compiler'),
      compiler = makeCompiler({
        jestConfig: { cache: true, cacheDirectory: tmp },
        tsJestConfig: { tsConfig: false },
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
    const fileName = `foo.test.js`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: { allowJs: true, outDir: '$$ts-jest$$' } },
      }),
      source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should have correct source maps', () => {
    const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } }),
      source = 'const g = (v: number) => v\nconst h: number = g(5)'

    const compiled = compiler.compile(source, 'foo.ts')

    expect(new ProcessedSource(compiled, 'foo.ts').outputSourceMaps).toMatchObject({
      file: 'foo.ts',
      sources: ['foo.ts'],
      sourcesContent: [source],
    })
  })

  it('should report diagnostics related to typings with pathRegex config matches file name', () => {
    const fileName = 'foo.ts',
      source = `
const g = (v: number) => v
const x: string = g(5)
`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: 'foo.ts' } },
      })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()

    removeSync(fileName)
  })

  it('should not report diagnostics related to typings with pathRegex config does not match file name', () => {
    const fileName = 'foo.ts',
      source = `
const f = (v: number) => v
const t: string = f(5)
`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: 'bar.ts' } },
      })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).not.toThrowError()

    removeSync(fileName)
  })
})
