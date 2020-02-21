import { LogLevels } from 'bs-logger'
import { writeFileSync } from 'fs'
import { removeSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { tempDir } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

const baseTsJestConfig = {
  experimental: true,
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
          tsConfig: { incremental: false },
          diagnostics: { pathRegex: fileName },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })

    it('should not report diagnostics with pathRegex config matches file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          tsConfig: { incremental: false },
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
          tsConfig: { incremental: true },
          diagnostics: { pathRegex: 'typings-error.ts' },
        },
      })

      expect(() => compiler.compile(source, fileName)).toThrowErrorMatchingSnapshot()
    })

    it('should not report diagnostics with pathRegex config does not match file name', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          tsConfig: { incremental: true },
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
        tsConfig: { incremental: false },
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
        tsConfig: { incremental: true },
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
  const tmp = tempDir('compiler'),
    fileName = 'test-cache.ts',
    source = 'console.log("hello")'

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should use the cache with normal program', () => {
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: { incremental: false },
      },
    })

    logTarget.clear()
    const compiled1 = compiler.compile(source, fileName)
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
      Array [
        "[level:20] readThrough(): cache miss
      ",
        "[level:20] updateMemoryCache() for program
      ",
        "[level:20] visitSourceFileNode(): hoisting
      ",
        "[level:20] getOutput(): computing diagnostics for program
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

  it('should use the cache with normal program', () => {
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: { incremental: true },
      },
    })

    logTarget.clear()
    const compiled1 = compiler.compile(source, fileName)
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
Array [
  "[level:20] readThrough(): cache miss
",
  "[level:20] updateMemoryCache() for program
",
  "[level:20] visitSourceFileNode(): hoisting
",
  "[level:20] getOutput(): computing diagnostics for incremental program
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
    source = 'export default 42'

  beforeAll(() => {
    writeFileSync(fileName, source, 'utf8')
  })

  afterAll(() => {
    removeSync(fileName)
  })

  it('should compile js file for allowJs true with normal program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: '$$ts-jest$$', incremental: false } },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })

  it('should compile js file for allowJs true with incremental program', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: '$$ts-jest$$', incremental: true } },
    })

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
  })
})

// describe('Not incremental program', () => {
//   const baseTsJestConfig = {
//     experimental: true,
//     compilerHost: true,
//   }
//
//   it('should use the cache', () => {
//     const tmp = tempDir('compiler'),
//       compiler = makeCompiler({
//         jestConfig: { cache: true, cacheDirectory: tmp },
//         tsJestConfig: { ...baseTsJestConfig, tsConfig: false },
//       }),
//       source = 'console.log("hello")'
//
//     logTarget.clear()
//     const compiled1 = compiler.compile(source, __filename)
//
//     expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
//       Array [
//         "[level:20] readThrough(): cache miss
//       ",
//         "[level:20] updateMemoryCache() for program
//       ",
//         "[level:20] visitSourceFileNode(): hoisting
//       ",
//         "[level:20] getOutput(): computing diagnostics for language service
//       ",
//         "[level:20] readThrough(): writing caches
//       ",
//       ]
//     `)
//
//     logTarget.clear()
//     const compiled2 = compiler.compile(source, __filename)
//
//     expect(logTarget.lines).toMatchInlineSnapshot(`
//       Array [
//         "[level:20] readThrough(): cache hit
//       ",
//       ]
//     `)
//
//     expect(new ProcessedSource(compiled1, __filename)).toMatchSnapshot()
//     expect(compiled2).toBe(compiled1)
//
//     logTarget.clear()
//   })
//
//   it('should throw error when cannot compile a file', () => {
//     const tmp = tempDir('compiler'),
//       compiler = makeCompiler({
//         jestConfig: { cache: true, cacheDirectory: tmp },
//         tsJestConfig: { ...baseTsJestConfig, tsConfig: false },
//       }),
//       source = 'console.log("hello")'
//
//     logTarget.clear()
//     try {
//       compiler.compile(source, 'foo')
//     } catch (e) {
//       expect(e).toMatchInlineSnapshot(`[TypeError: Unable to read file: foo]`)
//     }
//   })
//
//   it('should compile js file for allowJs true', () => {
//     const fileName = `${__filename}.test.js`,
//       compiler = makeCompiler({
//         tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: '$$ts-jest$$' } },
//       }),
//       source = 'export default 42'
//
//     writeFileSync(fileName, source, 'utf8')
//     const compiled = compiler.compile(source, fileName)
//
//     expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()
//
//     removeSync(fileName)
//   })
//
//   it('should get correct type info', () => {
//     const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } }),
//       source = `
//         type MyType {
//           /** the prop 1! */
//           p1: boolean
//         }
//         const val: MyType = {} as any
//         console.log(val.p1/* <== that */)
//         `
//
//     const ti = compiler.getTypeInfo(source, __filename, source.indexOf('/* <== that */') - 1)
//
//     // before TS 3.1 the comment had an extra trailing space
//     ti.comment = ti.comment.trim()
//     expect(ti).toEqual({
//       comment: 'the prop 1!',
//       name: 'boolean',
//     })
//
//     const ti2 = compiler.getTypeInfo(source, __filename, source.indexOf('/* foo */') - 1)
//     ti.comment = ti.comment.trim()
//     expect(ti2).toEqual({
//       comment: '',
//       name: '',
//     })
//   })
//
//   it('should have correct source maps', () => {
//     const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } }),
//       source = 'const f = (v: number) => v\nconst t: number = f(5)'
//
//     const compiled = compiler.compile(source, __filename)
//
//     expect(new ProcessedSource(compiled, __filename).outputSourceMaps).toMatchObject({
//       file: __filename,
//       sources: [__filename],
//       sourcesContent: [source],
//     })
//   })
//
//   it('should report diagnostics related to typings', () => {
//     const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })
//
//     expect(() =>
//       compiler.compile(
//         `
// const f = (v: number) => v
// const t: string = f(5)
// const v: boolean = t
// `,
//         'foo.ts',
//       ),
//     ).toThrowErrorMatchingSnapshot()
//   })
//
//   it('should report diagnostics with pathRegex config matches file name', () => {
//     const compiler = makeCompiler({
//       tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'foo.ts' } },
//     })
//
//     expect(() =>
//       compiler.compile(
//         `
// const f = (v: number) => v
// const t: string = f(5)
// const v: boolean = t
// `,
//         'foo.ts',
//       ),
//     ).toThrowErrorMatchingSnapshot()
//   })
//
//   it('should report diagnostics with pathRegex config does not match file name', () => {
//     const compiler = makeCompiler({
//       tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: '/bar.ts/' } },
//     })
//
//     expect(() =>
//       compiler.compile(
//         `
// const f = (v: number) => v
// const t: string = f(5)
// const v: boolean = t
// `,
//         'foo.ts',
//       ),
//     ).not.toThrowError()
//   })
// })
