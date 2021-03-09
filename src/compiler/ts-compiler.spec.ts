import { readFileSync } from 'fs'
import { join, normalize } from 'path'

import { makeCompiler } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { mockFolder } from '../__helpers__/path'
import ProcessedSource from '../__helpers__/processed-source'

const logTarget = logTargetMock()

describe('TsCompiler', () => {
  describe('isolatedModule true', () => {
    const baseTsJestConfig = {
      isolatedModules: true,
    }

    test('should transpile code with useESM true', () => {
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, useESM: true },
      })
      const fileName = join(mockFolder, 'thing.ts')

      const compiledOutput = compiler.getCompiledOutput(readFileSync(fileName, 'utf-8'), fileName, true)

      expect(new ProcessedSource(compiledOutput, fileName).outputCodeWithoutMaps).toMatchSnapshot()
    })

    test('should compile js file for allowJs true', () => {
      const fileName = 'foo.js'
      const compiler = makeCompiler({
        tsJestConfig: { ...baseTsJestConfig, tsconfig: { allowJs: true } },
      })
      const source = 'export default 42'

      const compiledOutput = compiler.getCompiledOutput(source, fileName, false)

      expect(new ProcessedSource(compiledOutput, fileName).outputCodeWithoutMaps).toMatchSnapshot()
    })

    describe('jsx option', () => {
      const fileName = 'foo.tsx'
      const source = `
        const App = () => {
          return <>Test</>
        }
      `

      it('should compile tsx file for jsx preserve', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              jsx: 'preserve',
            },
          },
        })
        const compiledOutput = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiledOutput, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })

      it('should compile tsx file for other jsx options', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              jsx: 'react',
            },
          },
        })
        const compiledOutput = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiledOutput, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })
    })

    describe('source maps', () => {
      const source = 'const f = (v: number) => v\nconst t: number = f(5)'
      const fileName = 'test-source-map-transpiler.ts'

      it('should have correct source maps without mapRoot', () => {
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })
        const compiledOutput = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiledOutput, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })

      it('should have correct source maps with mapRoot', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              mapRoot: './',
            },
          },
        })
        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })
    })

    describe('diagnostics', () => {
      it('should not report diagnostics related to typings', () => {
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })

        expect(() =>
          compiler.getCompiledOutput(
            `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
            'foo.ts',
            false,
          ),
        ).not.toThrowError()
      })

      it('should report diagnostics related to codes with exclude config is undefined', () => {
        const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsconfig: false } })

        expect(() =>
          compiler.getCompiledOutput(
            `
const f = (v: number) = v
const t: string = f(5)
`,
            'foo.ts',
            false,
          ),
        ).toThrowErrorMatchingSnapshot()
      })

      it('should report diagnostics related to codes with exclude config matches file name', () => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { exclude: ['foo.ts'] } },
        })

        expect(() =>
          compiler.getCompiledOutput(
            `
const f = (v: number) = v
const t: string = f(5)
`,
            'foo.ts',
            false,
          ),
        ).toThrowErrorMatchingSnapshot()
      })

      it('should not report diagnostics related to codes with exclude config does not match file name', () => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig, tsconfig: false, diagnostics: { exclude: ['bar.ts'] } },
        })

        expect(() =>
          compiler.getCompiledOutput(
            `
const f = (v: number) = v
const t: string = f(5)
`,
            'foo.ts',
            false,
          ),
        ).not.toThrowError()
      })
    })

    test('should use correct custom AST transformers', () => {
      // eslint-disable-next-line no-console
      console.log = jest.fn()
      const fileName = 'foo.js'
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          tsconfig: {
            allowJs: true,
          },
          astTransformers: {
            before: ['dummy-transformer'],
            after: ['dummy-transformer'],
            afterDeclarations: ['dummy-transformer'],
          },
        },
      })
      const source = 'export default 42'

      compiler.getCompiledOutput(source, fileName, false)

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledTimes(3)
    })
  })

  describe('isolatedModule false', () => {
    const baseTsJestConfig = { tsconfig: join(process.cwd(), 'tsconfig.spec.json') }
    const jestCacheFS = new Map<string, string>()

    beforeEach(() => {
      logTarget.clear()
    })

    test('should compile codes with useESM true', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          tsconfig: {
            module: 'ESNext',
            esModuleInterop: false,
            allowSyntheticDefaultImports: false,
          },
          useESM: true,
        },
      })
      const fileName = join(mockFolder, 'thing.ts')

      const compiledOutput = compiler.getCompiledOutput(readFileSync(fileName, 'utf-8'), fileName, true)

      expect(new ProcessedSource(compiledOutput, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      // @ts-expect-error _compilerOptions is a private property
      expect(compiler._compilerOptions.esModuleInterop).toEqual(true)
      // @ts-expect-error _compilerOptions is a private property
      expect(compiler._compilerOptions.allowSyntheticDefaultImports).toEqual(true)
      // @ts-expect-error _initialCompilerOptions is a private property
      expect(compiler._initialCompilerOptions.esModuleInterop).not.toEqual(true)
      // @ts-expect-error _initialCompilerOptions is a private property
      expect(compiler._initialCompilerOptions.allowSyntheticDefaultImports).not.toEqual(true)
    })

    describe('allowJs option', () => {
      const fileName = 'test-allow-js.js'
      const source = 'export default 42'
      jestCacheFS.set(fileName, source)

      it('should compile js file for allowJs true with outDir', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: { tsconfig: { allowJs: true, outDir: '$$foo$$' } },
          },
          jestCacheFS,
        )

        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })

      it('should compile js file for allowJs true without outDir', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: { tsconfig: { allowJs: true } },
          },
          jestCacheFS,
        )
        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })
    })

    describe('jsx option', () => {
      const fileName = 'test-jsx.tsx'
      const source = `
        const App = () => {
          return <>Test</>
        }
      `
      jestCacheFS.set(fileName, source)

      it('should compile tsx file for jsx preserve', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: {
              tsconfig: {
                jsx: 'preserve',
              },
            },
          },
          jestCacheFS,
        )

        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })

      it('should compile tsx file for other jsx options', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: {
              tsconfig: {
                jsx: 'react',
              },
            },
          },
          jestCacheFS,
        )
        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputCodeWithoutMaps).toMatchSnapshot()
      })
    })

    describe('source maps', () => {
      const source = 'const gsm = (v: number) => v\nconst h: number = gsm(5)'
      const fileName = 'test-source-map.ts'
      jestCacheFS.set(fileName, source)

      it('should have correct source maps without mapRoot', () => {
        const compiler = makeCompiler(
          { tsJestConfig: { tsconfig: require.resolve('../../tsconfig.spec.json') } },
          jestCacheFS,
        )
        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })

      it('should have correct source maps with mapRoot', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: {
              tsconfig: {
                mapRoot: './',
              },
            },
          },
          jestCacheFS,
        )
        const compiled = compiler.getCompiledOutput(source, fileName, false)

        expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
          file: fileName,
          sources: [fileName],
          sourcesContent: [source],
        })
      })
    })

    describe('module resolution', () => {
      it(`should use moduleResolutionCache`, () => {
        jest.unmock('typescript')
        const ts = require('typescript')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const moduleResolutionCacheMock = (ts.createModuleResolutionCache = jest.fn().mockImplementation(() => {}))

        makeCompiler({
          tsJestConfig: baseTsJestConfig,
        })

        expect(moduleResolutionCacheMock).toHaveBeenCalled()
        expect(moduleResolutionCacheMock.mock.calls[0].length).toBe(3)

        moduleResolutionCacheMock.mockRestore()
      })
    })

    describe('getResolvedModules', () => {
      const fileName = join(mockFolder, 'thing.ts')

      test('should return undefined when file name is not known to compiler', () => {
        const compiler = makeCompiler({
          tsJestConfig: baseTsJestConfig,
        })

        expect(compiler.getResolvedModules('const foo = 1', fileName, new Map())).toEqual([])
      })

      test('should return undefined when it is isolatedModules true', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            isolatedModules: true,
          },
        })

        expect(compiler.getResolvedModules('const foo = 1', fileName, new Map())).toEqual([])
      })

      test('should return undefined when file has no resolved modules', () => {
        const jestCacheFS = new Map<string, string>()
        jestCacheFS.set(fileName, 'const foo = 1')
        const compiler = makeCompiler(
          {
            tsJestConfig: baseTsJestConfig,
          },
          jestCacheFS,
        )

        expect(compiler.getResolvedModules('const foo = 1', fileName, new Map())).toEqual([])
      })

      test('should return resolved modules when file has resolved modules', () => {
        const jestCacheFS = new Map<string, string>()
        const importedModule1 = join(mockFolder, 'thing1.ts')
        const importedModule2 = join(mockFolder, 'thing2.ts')
        const fileContentWithModules = readFileSync(fileName, 'utf-8')
        jestCacheFS.set(importedModule1, readFileSync(importedModule1, 'utf-8'))
        const compiler = makeCompiler(
          {
            tsJestConfig: baseTsJestConfig,
          },
          jestCacheFS,
        )

        expect(
          compiler
            .getResolvedModules(fileContentWithModules, fileName, new Map())
            .map((resolvedFileName) => normalize(resolvedFileName)),
        ).toEqual([importedModule1, importedModule2])
      })
    })

    describe('diagnostics', () => {
      const importedFileName = join(mockFolder, 'thing.ts')
      const importedFileContent = readFileSync(importedFileName, 'utf-8')

      it(`shouldn't report diagnostics when file name doesn't match diagnostic file pattern`, () => {
        jestCacheFS.set(importedFileName, importedFileContent)
        const compiler = makeCompiler(
          {
            tsJestConfig: {
              ...baseTsJestConfig,
              diagnostics: { exclude: ['foo.spec.ts'] },
            },
          },
          jestCacheFS,
        )

        expect(() => compiler.getCompiledOutput(importedFileContent, importedFileName, false)).not.toThrowError()
      })

      it('should throw error when cannot compile', () => {
        const fileName = 'test-cannot-compile.d.ts'
        const source = `
        interface Foo {
          a: string
        }
      `
        jestCacheFS.set(fileName, source)
        const compiler = makeCompiler(
          {
            tsJestConfig: baseTsJestConfig,
          },
          jestCacheFS,
        )

        expect(() => compiler.getCompiledOutput(source, fileName, false)).toThrowErrorMatchingSnapshot()
      })

      test('should report correct diagnostics when file content has changed', () => {
        const compiler = makeCompiler(
          {
            tsJestConfig: baseTsJestConfig,
          },
          jestCacheFS,
        )
        const fileName = join(mockFolder, 'thing.ts')
        const oldSource = `
          foo.split('-');
        `
        const newSource = `
          const foo = 'bla-bla'
          foo.split('-');
        `
        jestCacheFS.set(fileName, oldSource)

        expect(() => compiler.getCompiledOutput(oldSource, fileName, false)).toThrowError()

        jestCacheFS.set(fileName, newSource)

        expect(() => compiler.getCompiledOutput(newSource, fileName, false)).not.toThrowError()
      })
    })

    test('should pass Program instance into custom transformers', () => {
      // eslint-disable-next-line no-console
      console.log = jest.fn()
      const fileName = join(mockFolder, 'thing.ts')
      const compiler = makeCompiler(
        {
          tsJestConfig: {
            ...baseTsJestConfig,
            astTransformers: {
              before: ['dummy-transformer'],
              after: ['dummy-transformer'],
              afterDeclarations: ['dummy-transformer'],
            },
          },
        },
        jestCacheFS,
      )

      compiler.getCompiledOutput(readFileSync(fileName, 'utf-8'), fileName, false)

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalled()
      // eslint-disable-next-line
      expect(((console.log as any) as jest.MockInstance<any, any>).mock.calls[0][0].emit).toBeDefined()
    })
  })
})
