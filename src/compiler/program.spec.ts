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

describe('cache', () => {
  const source = 'console.log("hello")'

  it('should use the cache with normal program', () => {
    const fileName = 'test-cache-program.ts'
    const tmp = tempDir('program-compiler')
    writeFileSync(fileName, source, 'utf8')
    const compiler = makeCompiler({
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
        "[level:20] updateMemoryCache(): update memory cache for program
      ",
        "[level:20] compileFn(): compiling using program
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] diagnoseFn(): computing diagnostics for test-cache-program.ts using program
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

    removeSync(fileName)
  })

  it('should use the cache with incremental program', () => {
    const fileName = 'test-cache-incremental-program.ts'
    const tmp = tempDir('incremental-program-compiler')
    writeFileSync(fileName, source, 'utf8')
    const compiler = makeCompiler({
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
        "[level:20] updateMemoryCache(): update memory cache for incremental program
      ",
        "[level:20] compileFn(): compiling using incremental program
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] diagnoseFn(): computing diagnostics for test-cache-incremental-program.ts using incremental program
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

    removeSync(fileName)
  })
})

describe('allowJs', () => {
  const baseFileName = 'test-allowJs'
  const baseFileExt = 'test.js'
  const source = 'export default 42'
  const tsConfig = { allowJs: true }

  describe(`with program`, () => {
    it('should compile js file for allowJs true with outDir', () => {
      const fileName = `${baseFileName}-program-outDir.${baseFileExt}`
      writeFileSync(fileName, source, 'utf8')
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: false,
          tsConfig: {
            ...tsConfig,
            outDir: '$$foo$$',
          },
        },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

      removeSync(fileName)
    })

    it('should compile js file for allowJs true without outDir', () => {
      const fileName = `${baseFileName}-program-no-outDir.${baseFileExt}`
      writeFileSync(fileName, source, 'utf8')
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, incremental: false, tsConfig },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

      removeSync(fileName)
    })
  })

  describe(`with incremental program`, () => {
    it('should compile js file for allowJs true with outDir', () => {
      const fileName = `${baseFileName}-incremental-outDir.${baseFileExt}`
      writeFileSync(fileName, source, 'utf8')
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: true,
          tsConfig: {
            ...tsConfig,
            outDir: '$$foo$$',
          },
        },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

      removeSync(fileName)
    })

    it('should compile js file for allowJs true without outDir', () => {
      const fileName = `${baseFileName}-incremental-no-outDir.${baseFileExt}`
      writeFileSync(fileName, source, 'utf8')
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, incremental: true, tsConfig },
      })

      const compiled = compiler.compile(source, fileName)

      expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

      removeSync(fileName)
    })
  })
})

describe('jsx preserve', () => {
  const fileName = 'test-jsx-preserve.tsx'
  const source = `
      const App = () => {
        return <>Test</>
      }
    `
  const tsConfig = {
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
  const fileName = 'test-jsx-options.tsx'
  const source = `
      const App = () => {
        return <>Test</>
      }
    `
  const tsConfig = {
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

describe('diagnostics', () => {
  const fileName = 'test-typings.ts'
  const source = `
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

      try {
        compiler.compile(source, fileName)
      } catch (e) {
        expect(e).not.toContain('TypeScript diagnostics')
      }
    })
  })

  describe('incremental program', () => {
    it('should report diagnostics with pathRegex config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          incremental: true,
          diagnostics: { pathRegex: fileName },
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

      try {
        compiler.compile(source, fileName)
      } catch (e) {
        expect(e).not.toContain('TypeScript diagnostics')
      }
    })
  })
})

describe('source-maps', () => {
  const fileName = 'source-maps-test.ts'
  const source = 'console.log("hello")'

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

describe('cannot compile', () => {
  const fileName1 = 'test-cannot-compile.d.ts'
  const fileName2 = 'test-cannot-compile.jsx'
  const source = `
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
