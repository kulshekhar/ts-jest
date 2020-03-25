import { LogLevels } from 'bs-logger'
import { writeFileSync } from 'fs'
import { removeSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

const baseTsJestConfig = {
  compilerHost: true,
}

describe('typings', () => {
  const fileName = 'test-typings.ts',
    source = `
const f = (v: number) => v
const t: string = f(5)
`

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  describe('normal program', () => {
    it('should report diagnostics with pathRegex config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: false,
          diagnostics: { pathRegex: fileName },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })

    it('should not report diagnostics with pathRegex config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: false,
          diagnostics: { pathRegex: 'foo.ts' },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })
  })

  describe('incremental program', () => {
    it('should report diagnostics with pathRegex config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: true,
          diagnostics: { pathRegex: 'typings-error.ts' },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })

    it('should not report diagnostics with pathRegex config does not match file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: true,
          diagnostics: { pathRegex: 'foo.ts' },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })
  })
})

describe('source-maps', () => {
  const fileName = 'source-maps-test.ts',
    source = 'console.log("hello")'

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should have correct source maps with normal program', () => {
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        incremental: false,
      },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
      file: fileName,
      sources: [fileName],
      sourcesContent: [source],
    })
  })

  it('should have correct source maps with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        incremental: true,
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

describe('cache', () => {
  const fileName = 'test-cache.ts',
    source = 'console.log("hello")'

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should use the cache with normal program', () => {
    const tmp = tempDir('program-compiler'),
      compiler = makeCompiler({
        jestConfig: { cache: true, cacheDirectory: tmp },
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: false,
        },
      })

    logTarget.clear()
    const compiled1 = compiler.compile(source, fileName)
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache miss
      ",
        "[level:20] compileFn(): compiling using program
      ",
        "[level:20] updateMemoryCache(): update memory cache for program
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] compileFn(): computing diagnostics for program
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

    expect(compiled2).toBe(compiled1)
  })

  it('should use the cache with incremental program', () => {
    const tmp = tempDir('incremental-program-compiler'),
      compiler = makeCompiler({
        jestConfig: { cache: true, cacheDirectory: tmp },
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: true,
        },
      })

    logTarget.clear()
    const compiled1 = compiler.compile(source, fileName)
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
Array [
  "[level:20] readThrough(): cache miss
",
  "[level:20] compileFn(): compiling using incremental program
",
  "[level:20] updateMemoryCache(): update memory cache for incremental program
",
  "[level:20] visitSourceFileNode(): hoisting
",
  "[level:20] compileFn(): computing diagnostics for incremental program
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

    expect(compiled2).toBe(compiled1)
  })
})

describe('allowJs', () => {
  const fileName = 'test-allowJs.test.js',
    source = 'export default 42',
    tsConfig = { allowJs: true, outDir: '$$ts-jest$$' }

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should compile js file for allowJs true with normal program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: false, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })

  it('should compile js file for allowJs true with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: true, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })
})

describe('jsx preserve', () => {
  const fileName = 'test-jsx-preserve.tsx',
    source = `
      const App = () => {
        return <>Test</>
      }
    `,
    tsConfig = {
      jsx: 'preserve' as any,
    }

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should compile tsx file with program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: false, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })

  it('should compile tsx file for with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: true, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })
})

describe('other jsx options', () => {
  const fileName = 'test-jsx-options.tsx',
    source = `
      const App = () => {
        return <>Test</>
      }
    `,
    tsConfig = {
      jsx: 'react' as any,
    }

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should compile tsx file for with program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: false, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })

  it('should compile tsx file for with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: true, tsConfig },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })
})

describe('cannot compile', () => {
  const fileName1 = 'test-cannot-compile.d.ts',
    fileName2 = 'test-cannot-compile.jsx',
    source = `
      interface Foo {
        a: string
      }
    `

  beforeAll(() => {
    writeFileSync(fileName1, source, 'utf8')
    writeFileSync(fileName2, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName1)
    removeSync(fileName2)
  })

  it('should throw error with normal program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: false, tsConfig: false },
    })

    expect(() => compiler.compile(source, fileName1)).toThrowErrorMatchingSnapshot()
    expect(() => compiler.compile(source, fileName2)).toThrowErrorMatchingSnapshot()
  })

  it('should throw error with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, incremental: true, tsConfig: false },
    })

    expect(() => compiler.compile(source, fileName1)).toThrowErrorMatchingSnapshot()
    expect(() => compiler.compile(source, fileName2)).toThrowErrorMatchingSnapshot()
  })
})
