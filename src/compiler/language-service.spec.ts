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
      source = 'console.log("hello")',
      fileName = 'test-cache.ts'

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

  it('should compile js file for allowJs true', () => {
    const fileName = `test-allow-js.js`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: { allowJs: true, outDir: '$$ts-jest$$' } },
      }),
      source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for jsx preserve', () => {
    const fileName = 'test-jsx-preserve.tsx',
      compiler = makeCompiler({
        tsJestConfig: {
          tsConfig: {
            jsx: 'preserve' as any,
          },
        },
      }),
      source = `
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
    const fileName = 'test-jsx-options.tsx',
      compiler = makeCompiler({
        tsJestConfig: {
          tsConfig: {
            jsx: 'react' as any,
          },
        },
      }),
      source = `
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
    const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } }),
      source = 'const gsm = (v: number) => v\nconst h: number = gsm(5)',
      fileName = 'test-source-map.ts'
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
    const fileName = 'test-match-regex-diagnostics.ts',
      source = `
const g = (v: number) => v
const x: string = g(5)
`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: fileName } },
      })
    writeFileSync(fileName, source, 'utf8')
    compiler.compile(source, fileName)

    expect(() => compiler.diagnose!(fileName)).toThrowErrorMatchingSnapshot()

    removeSync(fileName)
  })

  it('should not report diagnostics related to typings with pathRegex config does not match file name', () => {
    const fileName = 'test-non-match-regex-diagnostics.ts',
      source = `
const f = (v: number) => v
const t: string = f(5)
`,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: 'bar.ts' } },
      })
    writeFileSync(fileName, source, 'utf8')
    compiler.compile(source, fileName)

    expect(() => compiler.diagnose!(fileName)).not.toThrowError()

    removeSync(fileName)
  })

  it('should throw error when cannot compile', () => {
    const fileName = 'test-cannot-compile.d.ts',
      source = `
        interface Foo {
          a: string
        }
      `,
      compiler = makeCompiler({
        tsJestConfig: { tsConfig: false },
      })
    writeFileSync(fileName, source, 'utf8')

    expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()

    removeSync(fileName)
  })
})
