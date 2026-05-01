import { readFileSync } from 'fs'
import { basename, join, normalize } from 'path'

import { LogLevels } from 'bs-logger'
import type { TsConfigJson } from 'type-fest'
import ts from 'typescript'

import { createConfigSet, makeCompiler } from '../../__helpers__/fakers'
import { logTargetMock } from '../../__helpers__/mocks'
import { tsTranspileModule } from '../../transpilers/typescript/transpile-module'
import type { DepGraphInfo, TsJestTransformerOptions } from '../../types'
import { Errors, Helps, interpolate } from '../../utils/messages'

import { updateOutput } from './compiler-utils'
import { TsCompiler } from './ts-compiler'

jest.mock('typescript', () => {
  const actualModule = jest.requireActual('typescript') as typeof ts

  return {
    __esModule: true,
    ...actualModule,
    default: actualModule,
  }
})
jest.mock('../../transpilers/typescript/transpile-module', () => {
  const actualModule = jest.requireActual('../../transpilers/typescript/transpile-module')

  return {
    ...actualModule,
    tsTranspileModule: jest.fn(),
  }
})

const mockTsTranspileModule = jest.mocked(tsTranspileModule)

const mockFolder = join(process.cwd(), 'src', '__mocks__')

const baseTsJestConfig: TsJestTransformerOptions = {
  tsconfig: join(process.cwd(), 'tsconfig.json'),
}

const logTarget = logTargetMock()

describe('TsCompiler', () => {
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
          tsconfig: {
            isolatedModules: true,
          },
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
      const importedModule3 = join(mockFolder, 'babel-foo.config.js')
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
      ).toEqual([importedModule3, importedModule1, importedModule2])
    })
  })

  describe('getCompiledOutput', () => {
    describe('isolatedModules true', () => {
      const fileName = join(mockFolder, 'thing.ts')
      const fileContent = 'const bar = 1'

      test.each([
        {
          useESM: true,
          babelConfig: true,
          supportsStaticESM: false,
          module: 'CommonJS',
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: true,
          module: 'ESNext',
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: false,
          module: 'CommonJS',
        },
        {
          useESM: false,
          babelConfig: false,
          supportsStaticESM: true,
          module: 'CommonJS',
        },
      ])('should transpile code with config %p', ({ useESM, babelConfig, supportsStaticESM, module }) => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            useESM,
            babelConfig,
            tsconfig: {
              isolatedModules: true,
              customConditions: ['my-condition'],
              module,
            } as TsConfigJson,
          },
        })
        const transformersStub = {
          before: [],
          after: [],
          afterDeclarations: [],
        }
        // @ts-expect-error testing purpose
        const transpileMock = (compiler._ts.transpileModule = jest.fn<typeof transpileModule>().mockReturnValueOnce({
          sourceMapText: '{}',
          outputText: 'var bar = 1',
          diagnostics: [],
        } as ts.TranspileOutput))
        // @ts-expect-error testing purpose
        compiler._makeTransformers = jest.fn().mockReturnValueOnce(transformersStub)
        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM,
          watchMode: false,
        })

        const usedCompilerOptions = transpileMock.mock.calls[0][1].compilerOptions as ts.CompilerOptions
        expect(transpileMock).toHaveBeenCalled()
        expect({
          module: usedCompilerOptions.module,
          esModuleInterop: usedCompilerOptions.esModuleInterop,
          allowSyntheticDefaultImports: usedCompilerOptions.allowSyntheticDefaultImports,
          customConditions: usedCompilerOptions.customConditions,
        }).toMatchSnapshot()
      })

      test.each([true, false])('should report diagnostics if shouldReportDiagnostics is %p', (shouldReport) => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            useESM: false,
            tsconfig: {
              isolatedModules: true,
              module: 'CommonJS',
            },
          },
        })
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(shouldReport)
        const compileOutput: ts.TranspileOutput = {
          sourceMapText: '{}',
          outputText: 'var bar = 1',
          diagnostics: [
            {
              category: ts.DiagnosticCategory.Error,
              code: 123,
              messageText: 'An error occurs',
              file: undefined,
              start: 0,
              length: 1,
            },
          ],
        }
        // @ts-expect-error testing purpose
        compiler._ts.transpileModule = jest.fn().mockReturnValueOnce(compileOutput)
        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: true,
          watchMode: false,
        })

        if (shouldReport) {
          expect(compiler.configSet.raiseDiagnostics).toHaveBeenCalledWith(
            compileOutput.diagnostics,
            fileName,
            // @ts-expect-error testing purpose
            compiler._logger,
          )
        } else {
          expect(compiler.configSet.raiseDiagnostics).not.toHaveBeenCalled()
        }
      })

      it('should use tsTranspileModule when Node16/NodeNext is used', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              isolatedModules: true,
              module: 'Node16',
              moduleResolution: 'Node16',
            },
          },
        })
        mockTsTranspileModule.mockReturnValueOnce({
          outputText: '',
        })

        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: true,
          watchMode: false,
        })

        expect(mockTsTranspileModule).toHaveBeenCalled()
      })
    })

    describe('isolatedModules false', () => {
      const fileName = join(mockFolder, 'thing.ts')
      const fileContent = 'const bar = 1'
      const jsOutput = 'var bar = 1'
      const sourceMap = '{}'

      test('should return the original js content for js file with allowJs false and show warning log', () => {
        const configSet = createConfigSet({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              allowJs: false,
            },
          },
        })
        const compiler = new TsCompiler(configSet, new Map())

        expect(
          compiler.getCompiledOutput('const foo = 1', 'foo.js', {
            supportsStaticESM: false,
            depGraphs: new Map(),
            watchMode: false,
          }),
        ).toEqual({
          code: 'const foo = 1',
        })
        expect(logTarget.filteredLines(LogLevels.warn)).toEqual(
          expect.arrayContaining([
            expect.stringContaining(interpolate(Errors.GotJsFileButAllowJsFalse, { path: 'foo.js' })),
          ]),
        )
      })

      test.each([
        {
          useESM: true,
          supportsStaticESM: true,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.ESNext,
          expectedEsModuleInterop: false,
          // ESM path with forced module: ESNext — Bundler from ts-jest's tsconfig
          // is compatible and passes through.
          expectedModuleResolution: ts.ModuleResolutionKind.Bundler,
        },
        {
          useESM: true,
          supportsStaticESM: false,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
          // CJS path (useESM but no static ESM support) with forced module: CommonJS.
          // Bundler is incompatible with CommonJS on TypeScript ≤ 5 (TS5095), so it
          // is substituted to Node10.
          expectedModuleResolution: ts.ModuleResolutionKind.Node10,
        },
        {
          useESM: false,
          supportsStaticESM: true,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
          // Same CJS-path substitution as above.
          expectedModuleResolution: ts.ModuleResolutionKind.Node10,
        },
      ])(
        'should compile codes with useESM %p',
        ({
          useESM,
          supportsStaticESM,
          moduleValue,
          expectedModule,
          expectedEsModuleInterop,
          expectedModuleResolution,
        }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM,
              tsconfig: {
                module: moduleValue as TsConfigJson.CompilerOptions['module'],
                esModuleInterop: false,
                customConditions: ['my-condition'],
              },
            },
          })
          const emptyFile = join(mockFolder, 'empty.ts')
          configSet.parsedTsConfig.fileNames.push(emptyFile)
          const compiler = new TsCompiler(configSet, new Map())
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
            outputFiles: [{ text: sourceMap }, { text: jsOutput }],
            emitSkipped: false,
          } as ts.EmitOutput)
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])

          const output = compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM,
            watchMode: false,
          })

          // @ts-expect-error testing purpose
          const usedCompilerOptions = compiler._compilerOptions

          expect(usedCompilerOptions.module).toBe(expectedModule)
          expect(usedCompilerOptions.esModuleInterop).toBe(expectedEsModuleInterop)
          // baseTsJestConfig points at ts-jest's own tsconfig.json which sets
          // moduleResolution to Bundler. After #4198 the compiler preserves that value
          // when compatible with the forced module, and otherwise substitutes a
          // compatible value — see fixupCompilerOptionsForModuleKind for the rules.
          expect(usedCompilerOptions.moduleResolution).toBe(expectedModuleResolution)
          expect(usedCompilerOptions.customConditions).toBeUndefined()
          expect(output).toEqual({
            code: updateOutput(jsOutput, fileName, sourceMap),
            diagnostics: [],
          })

          // @ts-expect-error testing purpose
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          compiler._languageService!.getSemanticDiagnostics(fileName)

          // @ts-expect-error testing purpose
          expect(compiler._fileContentCache.has(emptyFile)).toBe(true)
        },
      )

      test('should compile codes for ESM mode and show warning with modern Node module', () => {
        const configSet = createConfigSet({
          tsJestConfig: {
            ...baseTsJestConfig,
            useESM: true,
            tsconfig: {
              module: 'NodeNext',
              esModuleInterop: false,
              customConditions: ['my-condition'],
            },
          },
        })
        const emptyFile = join(mockFolder, 'empty.ts')
        configSet.parsedTsConfig.fileNames.push(emptyFile)
        const compiler = new TsCompiler(configSet, new Map())
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: false,
        } as ts.EmitOutput)
        // @ts-expect-error testing purpose
        compiler.getDiagnostics = jest.fn().mockReturnValue([])

        const output = compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: true,
          watchMode: false,
        })

        // @ts-expect-error testing purpose
        const usedCompilerOptions = compiler._compilerOptions

        expect(usedCompilerOptions.module).toBe(ts.ModuleKind.ESNext)
        expect(usedCompilerOptions.esModuleInterop).toBe(true)
        // baseTsJestConfig points at ts-jest's own tsconfig.json which sets
        // moduleResolution to Bundler. After #4198 the compiler preserves that value
        // instead of forcing it to Node10 — see fixupCompilerOptionsForModuleKind.
        expect(usedCompilerOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler)
        expect(usedCompilerOptions.customConditions).toBeUndefined()
        expect(output).toEqual({
          code: updateOutput(jsOutput, fileName, sourceMap),
          diagnostics: [],
        })
        expect(logTarget.filteredLines(LogLevels.warn)).toEqual(
          expect.arrayContaining([expect.stringContaining(Helps.UsingModernNodeResolution)]),
        )

        // @ts-expect-error testing purpose
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        compiler._languageService!.getSemanticDiagnostics(fileName)

        // @ts-expect-error testing purpose
        expect(compiler._fileContentCache.has(emptyFile)).toBe(true)
      })

      // Closes #4198. Each row is a `moduleResolution` value the user explicitly sets in
      // their tsconfig. The CJS path forces `module: CommonJS`, which TypeScript binds
      // tightly to a small set of compatible resolutions:
      //   - Node10 / Classic: pass through (always valid with CommonJS)
      //   - Node16 / NodeNext: substitute → Node10 (TS5110 forbids them with CommonJS)
      //   - Bundler: substitute → Node10 (TS5095 forbids CommonJS+Bundler on TS ≤ 5;
      //     a TS6+ enhancement can pass Bundler through in a follow-up)
      test.each([
        { moduleResolutionValue: 'Bundler', expectedKind: ts.ModuleResolutionKind.Node10 },
        { moduleResolutionValue: 'Node16', expectedKind: ts.ModuleResolutionKind.Node10 },
        { moduleResolutionValue: 'NodeNext', expectedKind: ts.ModuleResolutionKind.Node10 },
        { moduleResolutionValue: 'Classic', expectedKind: ts.ModuleResolutionKind.Classic },
        { moduleResolutionValue: 'Node10', expectedKind: ts.ModuleResolutionKind.Node10 },
      ])(
        'should resolve user-supplied moduleResolution %p compatibly for non-ESM compilation',
        ({ moduleResolutionValue, expectedKind }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              tsconfig: {
                module: 'CommonJS',
                moduleResolution: moduleResolutionValue as TsConfigJson.CompilerOptions['moduleResolution'],
              },
            },
          })
          const emptyFile = join(mockFolder, 'empty.ts')
          configSet.parsedTsConfig.fileNames.push(emptyFile)
          const compiler = new TsCompiler(configSet, new Map())
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
            outputFiles: [{ text: sourceMap }, { text: jsOutput }],
            emitSkipped: false,
          } as ts.EmitOutput)
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])

          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM: false,
            watchMode: false,
          })

          // @ts-expect-error testing purpose
          const usedCompilerOptions = compiler._compilerOptions

          expect(usedCompilerOptions.moduleResolution).toBe(expectedKind)
        },
      )

      // Closes #4198 (ESM path). The ESM path forces `module: ESNext` whenever the user
      // had a modern Node module kind. ESNext pairs cleanly with Bundler/Node10/Classic
      // but not with Node16/NodeNext (TS5110), so those two are substituted to Bundler
      // — non-deprecated, broadly compatible, and the closest semantic match.
      test.each([
        { moduleResolutionValue: 'Bundler', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'Node16', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'NodeNext', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'Classic', expectedKind: ts.ModuleResolutionKind.Classic },
        { moduleResolutionValue: 'Node10', expectedKind: ts.ModuleResolutionKind.Node10 },
      ])(
        'should resolve user-supplied moduleResolution %p compatibly for ESM compilation',
        ({ moduleResolutionValue, expectedKind }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM: true,
              tsconfig: {
                module: 'ESNext',
                moduleResolution: moduleResolutionValue as TsConfigJson.CompilerOptions['moduleResolution'],
              },
            },
          })
          const emptyFile = join(mockFolder, 'empty.ts')
          configSet.parsedTsConfig.fileNames.push(emptyFile)
          const compiler = new TsCompiler(configSet, new Map())
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
            outputFiles: [{ text: sourceMap }, { text: jsOutput }],
            emitSkipped: false,
          } as ts.EmitOutput)
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])

          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM: true,
            watchMode: false,
          })

          // @ts-expect-error testing purpose
          const usedCompilerOptions = compiler._compilerOptions

          expect(usedCompilerOptions.moduleResolution).toBe(expectedKind)
        },
      )

      // Regression coverage for the case where ts-jest is running against a
      // TypeScript version (4.3 - 4.9) that predates ModuleResolutionKind.Bundler.
      // The peerDependency range is `>=4.3 <7`, so this matters: on those
      // versions `ts.ModuleResolutionKind.Bundler` is `undefined` at runtime
      // and the ESM-path Node16/NodeNext substitution must fall back to Node10
      // rather than returning an undefined moduleResolution. Simulated by
      // constructing a ts-like module whose ModuleResolutionKind has Bundler
      // stripped, then exercising the private resolver directly.
      describe('moduleResolution fallback when ModuleResolutionKind.Bundler is unavailable (TypeScript < 5.0)', () => {
        /**
         * Build a TsCompiler whose `_ts` reference simulates a TypeScript runtime
         * predating `ModuleResolutionKind.Bundler` (TS 4.3 - 4.9). Used by the
         * tests in this describe block to verify the ESM-path Node16/NodeNext
         * substitution falls back to Node10 rather than returning `undefined`
         * when Bundler is missing from the runtime enum.
         */
        function buildCompilerWithoutBundler(): TsCompiler {
          const configSet = createConfigSet({ tsJestConfig: baseTsJestConfig })
          const compiler = new TsCompiler(configSet, new Map())
          const tsLikeWithoutBundler = {
            ...ts,
            ModuleResolutionKind: { ...ts.ModuleResolutionKind, Bundler: undefined },
          } as unknown as typeof ts
          // @ts-expect-error testing purpose: replace the ts reference to simulate a runtime where Bundler is missing
          compiler._ts = tsLikeWithoutBundler

          return compiler
        }

        test.each([ts.ModuleResolutionKind.Node16, ts.ModuleResolutionKind.NodeNext])(
          'returns Node10 (not undefined) when the user supplies %p on the ESM path',
          (userKind) => {
            const compiler = buildCompilerWithoutBundler()
            // @ts-expect-error testing purpose: invoking a private method directly
            const resolved = compiler.resolveCompatibleModuleResolution(ts.ModuleKind.ESNext, userKind)
            expect(resolved).toBe(ts.ModuleResolutionKind.Node10)
          },
        )

        test('returns Node10 when the user supplies Node16/NodeNext on the CJS path (no behavior change)', () => {
          const compiler = buildCompilerWithoutBundler()
          // @ts-expect-error testing purpose: invoking a private method directly
          const resolved = compiler.resolveCompatibleModuleResolution(
            ts.ModuleKind.CommonJS,
            ts.ModuleResolutionKind.NodeNext,
          )
          expect(resolved).toBe(ts.ModuleResolutionKind.Node10)
        })

        test('preserves explicitly supplied Node10/Classic (the user-supplied-Bundler branch is unreachable on TS < 5)', () => {
          const compiler = buildCompilerWithoutBundler()
          for (const userKind of [ts.ModuleResolutionKind.Node10, ts.ModuleResolutionKind.Classic]) {
            // @ts-expect-error testing purpose: invoking a private method directly
            const cjs = compiler.resolveCompatibleModuleResolution(ts.ModuleKind.CommonJS, userKind)
            // @ts-expect-error testing purpose: invoking a private method directly
            const esm = compiler.resolveCompatibleModuleResolution(ts.ModuleKind.ESNext, userKind)
            expect(cjs).toBe(userKind)
            expect(esm).toBe(userKind)
          }
        })
      })

      test('should show a warning message and return original file content for non ts/tsx files if emitSkipped is true', () => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig },
        })
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: true,
        } as ts.EmitOutput)
        // @ts-expect-error testing purpose
        compiler._logger.warn = jest.fn()
        // @ts-expect-error testing purpose
        compiler.getDiagnostics = jest.fn().mockReturnValue([])
        const fileToCheck = fileName.replace('.ts', '.js')

        const output = compiler.getCompiledOutput(fileContent, fileToCheck, {
          depGraphs: new Map(),
          supportsStaticESM: false,
          watchMode: false,
        })

        // @ts-expect-error testing purpose
        expect(compiler._logger.warn).toHaveBeenCalled()
        expect(output).toEqual({
          code: updateOutput(fileContent, fileToCheck),
        })
      })

      test.each([fileName, fileName.replace('.ts', '.tsx')])(
        'should throw error for ts/tsx files if emitSkipped is true',
        (fileToCheck) => {
          const compiler = makeCompiler({
            tsJestConfig: { ...baseTsJestConfig },
          })
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
            outputFiles: [{ text: sourceMap }, { text: jsOutput }],
            emitSkipped: true,
          } as ts.EmitOutput)
          // @ts-expect-error testing purpose
          compiler._logger.warn = jest.fn()
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])

          // @ts-expect-error testing purpose
          expect(compiler._logger.warn).not.toHaveBeenCalled()
          expect(() =>
            compiler.getCompiledOutput(fileContent, fileToCheck, {
              depGraphs: new Map(),
              supportsStaticESM: false,
              watchMode: false,
            }),
          ).toThrow()
        },
      )

      test('should throw error when there are no outputFiles', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: { module: 'CommonJS' },
          },
        })
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [],
          emitSkipped: false,
        } as ts.EmitOutput)
        // @ts-expect-error testing purpose
        compiler.getDiagnostics = jest.fn().mockReturnValue([])

        expect(() =>
          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM: false,
            watchMode: false,
          }),
        ).toThrow(
          new TypeError(
            interpolate(Errors.UnableToRequireDefinitionFile, {
              file: basename(fileName),
            }),
          ),
        )
      })
    })
  })

  describe('_makeTransformers', () => {
    test('should return the transformers object which contains before, after and afterDeclarations transformers', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          ...baseTsJestConfig,
          useESM: false,
          tsconfig: {
            isolatedModules: true,
          },
        },
      })
      const transformerStub = join(mockFolder, 'dummy-transformer.js')
      console.log = jest.fn()

      // @ts-expect-error testing purpose
      const transformers = compiler._makeTransformers({
        before: [
          {
            name: 'dummy-transformer',
            version: 1,
            factory: require(transformerStub).factory,
          },
        ],
        after: [
          {
            name: 'dummy-transformer',
            version: 1,
            factory: require(transformerStub).factory,
          },
        ],
        afterDeclarations: [
          {
            name: 'dummy-transformer',
            version: 1,
            factory: require(transformerStub).factory,
          },
        ],
      })

      expect(transformers.before?.length).toEqual(1)
      expect(transformers.after?.length).toEqual(1)
      expect(transformers.afterDeclarations?.length).toEqual(1)
    })
  })

  describe('_updateMemoryCache', () => {
    const fileName = join(mockFolder, 'thing.ts')
    const fileContent = 'const bar = 1'
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsconfig: {
          isolatedModules: true,
        },
      },
    })
    const fileContentCache = new Map<string, string>()
    const fileVersionCache = new Map<string, number>()

    beforeEach(() => {
      // @ts-expect-error testing purpose
      compiler._projectVersion = 1
      /**
       * This is to ensure that `compilerOptions` value and `_parsedTsConfig.fileNames` are always like
       * when compiler instance is created since here we only create compiler instance once for all the tests below.
       */
      // @ts-expect-error testing purpose.
      compiler._compilerOptions = { ...compiler._initialCompilerOptions }
      // @ts-expect-error testing purpose.
      compiler._parsedTsConfig.fileNames = []
      fileContentCache.clear()
      fileVersionCache.clear()
    })

    test('should increase project version if processing file is not in _fileContentCache', () => {
      // @ts-expect-error testing purpose
      compiler._fileContentCache = fileContentCache
      // @ts-expect-error testing purpose
      compiler._fileVersionCache = fileVersionCache

      // @ts-expect-error testing purpose
      compiler._updateMemoryCache(fileContent, fileName)

      // @ts-expect-error testing purpose
      expect(compiler._projectVersion).toEqual(2)
    })

    test('should increase project version if processing file is not in _fileVersionCache', () => {
      fileContentCache.set(fileName, fileContent)
      // @ts-expect-error testing purpose
      compiler._fileContentCache = fileContentCache
      // @ts-expect-error testing purpose
      compiler._fileVersionCache = fileVersionCache

      // @ts-expect-error testing purpose
      compiler._updateMemoryCache(fileContent, fileName)

      // @ts-expect-error testing purpose
      expect(compiler._projectVersion).toEqual(2)
    })

    test('should increase project version if module value has changed', () => {
      fileContentCache.set(fileName, fileContent)
      fileVersionCache.set(fileName, 1)
      // @ts-expect-error testing purpose
      compiler._fileContentCache = fileContentCache
      // @ts-expect-error testing purpose
      compiler._fileVersionCache = fileVersionCache

      // @ts-expect-error testing purpose
      compiler._updateMemoryCache(fileContent, fileName, false)

      // @ts-expect-error testing purpose
      expect(compiler._projectVersion).toEqual(2)
    })

    test('should increase project version if processing file version is 0', () => {
      fileContentCache.set(fileName, fileContent)
      fileVersionCache.set(fileName, 0)
      // @ts-expect-error testing purpose
      compiler._fileContentCache = fileContentCache
      // @ts-expect-error testing purpose
      compiler._fileVersionCache = fileVersionCache

      // @ts-expect-error testing purpose
      compiler._updateMemoryCache(fileContent, fileName)

      // @ts-expect-error testing purpose
      expect(compiler._projectVersion).toEqual(2)
    })

    test(
      'should increase file version in _fileVersionCache as well as ' +
        'update file content in _fileContentCache for processing file if previous ' +
        'content is not the same as new content and increase project version',
      () => {
        const newContent = 'const foo = 1'
        fileContentCache.set(fileName, fileContent)
        fileVersionCache.set(fileName, 1)
        // @ts-expect-error testing purpose
        compiler._fileContentCache = fileContentCache
        // @ts-expect-error testing purpose
        compiler._fileVersionCache = fileVersionCache

        // @ts-expect-error testing purpose
        compiler._updateMemoryCache(newContent, fileName)

        // @ts-expect-error testing purpose
        expect(compiler._fileVersionCache.get(fileName)).toEqual(2)
        // @ts-expect-error testing purpose
        expect(compiler._fileContentCache.get(fileName)).toEqual(newContent)
        // @ts-expect-error testing purpose
        expect(compiler._projectVersion).toEqual(2)
      },
    )

    test(
      'should only increase project version if the previous content is the ' +
        'same as current content and the processing file is not in the list of compiler file names',
      () => {
        fileContentCache.set(fileName, fileContent)
        fileVersionCache.set(fileName, 1)
        // @ts-expect-error testing purpose
        compiler._fileContentCache = fileContentCache
        // @ts-expect-error testing purpose
        compiler._fileVersionCache = fileVersionCache
        // @ts-expect-error testing purpose
        compiler._parsedTsConfig.fileNames = []

        // @ts-expect-error testing purpose
        compiler._updateMemoryCache(fileContent, fileName)

        // @ts-expect-error testing purpose
        expect(compiler._fileVersionCache.get(fileName)).toEqual(1)
        // @ts-expect-error testing purpose
        expect(compiler._fileContentCache.get(fileName)).toEqual(fileContent)

        // @ts-expect-error testing purpose
        expect(compiler._projectVersion).toEqual(2)
      },
    )

    test(
      'should not increase project version if the previous content is ' +
        'the same as current content and the processing file is in the list of compiler file names',
      () => {
        fileContentCache.set(fileName, fileContent)
        fileVersionCache.set(fileName, 1)
        // @ts-expect-error testing purpose
        compiler._fileContentCache = fileContentCache
        // @ts-expect-error testing purpose
        compiler._fileVersionCache = fileVersionCache
        // @ts-expect-error testing purpose
        compiler._parsedTsConfig.fileNames = [fileName]

        // @ts-expect-error testing purpose
        compiler._updateMemoryCache(fileContent, fileName)

        // @ts-expect-error testing purpose
        expect(compiler._fileVersionCache.get(fileName)).toEqual(1)
        // @ts-expect-error testing purpose
        expect(compiler._fileContentCache.get(fileName)).toEqual(fileContent)

        // @ts-expect-error testing purpose
        expect(compiler._projectVersion).toEqual(1)
      },
    )
  })

  describe('getDiagnostics', () => {
    const fileName = join(mockFolder, 'thing.ts')
    const fileName1 = join(mockFolder, 'thing1.ts')
    const fileContent = 'const bar = 1'
    const jsOutput = 'var bar = 1'
    const sourceMap = '{}'

    test.each([true, false])(
      'should/should not report diagnostics if shouldReportDiagnostics is %p in non-watch mode',
      (shouldReport) => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: { module: 'CommonJS' },
          },
        })
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(shouldReport)
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: false,
        } as ts.EmitOutput)
        const diagnostics = [
          {
            category: ts.DiagnosticCategory.Error,
            code: 123,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
          {
            category: ts.DiagnosticCategory.Error,
            code: 456,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
        ]
        // @ts-expect-error testing purpose
        compiler._languageService?.getSemanticDiagnostics = jest.fn().mockReturnValueOnce([diagnostics[0]])
        // @ts-expect-error testing purpose
        compiler._languageService?.getSyntacticDiagnostics = jest.fn().mockReturnValueOnce([diagnostics[1]])
        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: false,
          watchMode: false,
        })

        if (shouldReport) {
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSemanticDiagnostics).toHaveBeenCalledWith(fileName)
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSyntacticDiagnostics).toHaveBeenCalledWith(fileName)
          expect(compiler.configSet.raiseDiagnostics).toHaveBeenCalledWith(
            diagnostics,
            fileName,
            // @ts-expect-error testing purpose
            compiler._logger,
          )
        } else {
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSemanticDiagnostics).not.toHaveBeenCalled()
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSyntacticDiagnostics).not.toHaveBeenCalled()
          expect(compiler.configSet.raiseDiagnostics).not.toHaveBeenCalled()
        }
      },
    )

    test(
      'should/should not report diagnostics in watch mode when shouldReportDiagnostics is %p ' +
        'and processing file is used by other files',
      () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: { module: 'CommonJS' },
            useESM: false,
          },
        })
        const depGraphs = new Map<string, DepGraphInfo>()
        depGraphs.set(fileName1, {
          fileContent,
          resolvedModuleNames: [fileName],
        })
        const diagnostics = [
          {
            category: ts.DiagnosticCategory.Error,
            code: 123,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
          {
            category: ts.DiagnosticCategory.Error,
            code: 456,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
        ]
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(false)
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: false,
        } as ts.EmitOutput)
        // @ts-expect-error testing purpose
        compiler._getFileContentFromCache = jest.fn()
        // @ts-expect-error testing purpose
        compiler._languageService?.getSemanticDiagnostics = jest.fn().mockImplementation((fileToGet) => {
          return fileToGet === fileName ? [] : [diagnostics[0]]
        })
        // @ts-expect-error testing purpose
        compiler._languageService?.getSyntacticDiagnostics = jest.fn().mockImplementation((fileToGet) => {
          return fileToGet === fileName ? [] : [diagnostics[1]]
        })

        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs,
          supportsStaticESM: false,
          watchMode: true,
        })

        // @ts-expect-error testing purpose
        expect(compiler._languageService?.getSemanticDiagnostics).not.toHaveBeenCalled()
        // @ts-expect-error testing purpose
        expect(compiler._languageService?.getSyntacticDiagnostics).not.toHaveBeenCalled()
        expect(compiler.configSet.raiseDiagnostics).not.toHaveBeenCalled()
      },
    )

    test('should not report diagnostics in watch mode when processing file is not used by other files', () => {
      const compiler = makeCompiler({
        tsJestConfig: {
          tsconfig: {
            module: 'CommonJS',
          },
        },
      })
      const depGraphs = new Map<string, DepGraphInfo>()
      depGraphs.set(fileName1, {
        fileContent,
        resolvedModuleNames: ['bar.ts'],
      })
      compiler.configSet.raiseDiagnostics = jest.fn()
      compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(false)
      // @ts-expect-error testing purpose
      compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
        outputFiles: [{ text: sourceMap }, { text: jsOutput }],
        emitSkipped: false,
      } as ts.EmitOutput)
      // @ts-expect-error testing purpose
      compiler._getFileContentFromCache = jest.fn()
      // @ts-expect-error testing purpose
      compiler._languageService?.getSemanticDiagnostics = jest.fn().mockReturnValueOnce([])
      // @ts-expect-error testing purpose
      compiler._languageService?.getSyntacticDiagnostics = jest.fn().mockReturnValueOnce([])

      compiler.getCompiledOutput(fileContent, fileName, {
        depGraphs,
        supportsStaticESM: false,
        watchMode: true,
      })

      // @ts-expect-error testing purpose
      expect(compiler._languageService?.getSemanticDiagnostics).not.toHaveBeenCalled()
      // @ts-expect-error testing purpose
      expect(compiler._languageService?.getSyntacticDiagnostics).not.toHaveBeenCalled()
      expect(compiler.configSet.raiseDiagnostics).not.toHaveBeenCalled()
    })

    it.each(['NodeNext', 'Node16', 'Node18'] as TsConfigJson.CompilerOptions['module'][])(
      'should not fail test when getting diagnostics about using modern Node module %s',
      (moduleValue) => {
        const compiler = makeCompiler({
          tsJestConfig: {
            tsconfig: {
              module: moduleValue as TsConfigJson.CompilerOptions['module'],
            },
          },
        })
        const depGraphs = new Map<string, DepGraphInfo>()
        depGraphs.set(fileName1, {
          fileContent,
          resolvedModuleNames: ['bar.ts'],
        })
        jest.spyOn(compiler.configSet, 'raiseDiagnostics')

        expect(() =>
          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs,
            supportsStaticESM: false,
            watchMode: true,
          }),
        ).not.toThrow()
      },
    )
  })
})
