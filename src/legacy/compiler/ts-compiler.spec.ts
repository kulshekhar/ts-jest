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

  describe('_resolveModuleName', () => {
    const fileName = join(mockFolder, 'thing.ts')

    function buildCompilerWithResolverSpies(): {
      compiler: TsCompiler
      resolveSpy: jest.Mock
      getImpliedSpy: jest.Mock
    } {
      const compiler = makeCompiler({ tsJestConfig: baseTsJestConfig })
      const resolveSpy = jest.fn().mockReturnValue({
        resolvedModule: undefined,
        failedLookupLocations: [],
      } as unknown as ts.ResolvedModuleWithFailedLookupLocations)
      const getImpliedSpy = jest.fn(ts.getImpliedNodeFormatForFile) as unknown as jest.Mock
      const tsProxy = {
        ...ts,
        resolveModuleName: resolveSpy,
        getImpliedNodeFormatForFile: getImpliedSpy,
      } as unknown as typeof ts
      // @ts-expect-error testing purpose: replace the ts reference on this compiler instance only
      compiler._ts = tsProxy

      return { compiler, resolveSpy, getImpliedSpy }
    }

    test('passes the resolutionMode argument from getImpliedNodeFormatForFile to resolveModuleName', () => {
      const { compiler, resolveSpy, getImpliedSpy } = buildCompilerWithResolverSpies()
      const fakeMode = ts.ModuleKind.ESNext
      getImpliedSpy.mockReturnValue(fakeMode)

      // @ts-expect-error testing purpose: invoking a private method directly
      compiler._resolveModuleName('lodash', fileName)

      expect(resolveSpy).toHaveBeenCalledTimes(1)
      const call = resolveSpy.mock.calls[0]
      expect(call).toHaveLength(7)
      expect(call[0]).toBe('lodash')
      expect(call[1]).toBe(fileName)
      expect(call[5]).toBeUndefined()
      expect(call[6]).toBe(fakeMode)
    })

    test('calls getImpliedNodeFormatForFile with the importing file, host, and compiler options', () => {
      const { compiler, getImpliedSpy } = buildCompilerWithResolverSpies()
      getImpliedSpy.mockReturnValue(ts.ModuleKind.ESNext)
      // Clear calls made by the language service during compiler construction.
      getImpliedSpy.mockClear()

      // @ts-expect-error testing purpose: invoking a private method directly
      compiler._resolveModuleName('lodash', fileName)

      const callsForOurFile = getImpliedSpy.mock.calls.filter((c: unknown[]) => c[0] === fileName)
      expect(callsForOurFile).toHaveLength(1)
      const call = callsForOurFile[0]
      expect(call[0]).toBe(fileName)
      expect(call[1]).toBeUndefined()
      expect(call[2]).toBeDefined()
      expect(call[3]).toBeDefined()
    })

    test.each([
      ['/some/file.mts', ts.ModuleKind.ESNext],
      ['/some/file.cts', ts.ModuleKind.CommonJS],
    ] as const)(
      'derives resolutionMode for explicit %s extension via getImpliedNodeFormatForFile',
      (containingFile, expectedMode) => {
        const { compiler, resolveSpy, getImpliedSpy } = buildCompilerWithResolverSpies()
        getImpliedSpy.mockReturnValue(expectedMode)

        // @ts-expect-error testing purpose
        compiler._resolveModuleName('lodash', containingFile)

        expect(resolveSpy.mock.calls[0][6]).toBe(expectedMode)
      },
    )
  })

  describe('getCompiledOutput', () => {
    describe('isolatedModules true', () => {
      const fileName = join(mockFolder, 'thing.ts')
      const fileContent = 'const bar = 1'

      beforeEach(() => {
        mockTsTranspileModule.mockReset()
      })

      test('should use the checked transpiler for isolated CommonJS compilation', () => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              isolatedModules: true,
              module: 'CommonJS',
            },
          },
        })
        const diagnostics: ts.Diagnostic[] = [
          {
            category: ts.DiagnosticCategory.Error,
            code: 123,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
        ]
        mockTsTranspileModule.mockReturnValueOnce({
          outputText: 'var bar = 1',
          sourceMapText: '{}',
          diagnostics,
        })
        compiler.configSet.raiseDiagnostics = jest.fn()

        const output = compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: false,
          watchMode: false,
        })

        expect(mockTsTranspileModule).toHaveBeenCalledWith(
          fileContent,
          expect.objectContaining({
            fileName,
            compilerOptions: expect.objectContaining({ module: ts.ModuleKind.CommonJS }),
            reportDiagnostics: true,
            transformers: expect.any(Function),
          }),
          compiler.configSet.compilerModule,
        )
        expect(output).toEqual({
          code: updateOutput('var bar = 1', fileName, '{}'),
        })
        expect(compiler.configSet.raiseDiagnostics).toHaveBeenCalledWith(
          diagnostics,
          fileName,
          // @ts-expect-error testing purpose
          compiler._logger,
        )
      })

      test('should use the configured compiler runtime and checked-transpiler program for isolated compilation', () => {
        const configSet = createConfigSet({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              isolatedModules: true,
              module: 'CommonJS',
            },
          },
        })
        const createProgram = jest.fn(ts.createProgram)
        const configuredCompiler = {
          ...ts,
          createProgram,
          createSourceFile: jest.fn(ts.createSourceFile),
          getDefaultCompilerOptions: jest.fn(ts.getDefaultCompilerOptions),
        } as unknown as typeof ts
        Object.defineProperty(configSet, 'compilerModule', { value: configuredCompiler })

        const compiler = new TsCompiler(configSet, new Map())
        const actualTsTranspileModule = jest.requireActual('../../transpilers/typescript/transpile-module')
          .tsTranspileModule as typeof tsTranspileModule
        let checkedProgram: ts.Program | undefined
        const transformerFactory = jest.fn(() => (sourceFile: ts.SourceFile) => sourceFile)
        configSet.resolvedTransformers = {
          before: [
            {
              name: 'configured-transformer',
              version: 1,
              factory: () => transformerFactory,
            },
          ],
          after: [],
          afterDeclarations: [],
        }
        mockTsTranspileModule.mockImplementation((input, options, compilerModule) =>
          actualTsTranspileModule(
            input,
            {
              ...options,
              transformers: (program) => {
                checkedProgram = program

                return options.transformers?.(program)
              },
            },
            compilerModule,
          ),
        )

        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM: false,
          watchMode: false,
        })

        expect(mockTsTranspileModule).toHaveBeenCalledWith(fileContent, expect.any(Object), configuredCompiler)
        expect(configuredCompiler.createProgram).toHaveBeenCalled()
        expect(checkedProgram).toBe(createProgram.mock.results[0].value)
        expect(checkedProgram?.getCompilerOptions().module).toBe(ts.ModuleKind.CommonJS)
        expect(transformerFactory).toHaveBeenCalled()
      })

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
              esModuleInterop: true,
              isolatedModules: true,
              customConditions: ['my-condition'],
              module,
              moduleResolution: 'Bundler',
            } as TsConfigJson,
          },
        })
        const transformersStub = {
          before: [],
          after: [],
          afterDeclarations: [],
        }
        mockTsTranspileModule.mockReturnValueOnce({
          sourceMapText: '{}',
          outputText: 'var bar = 1',
          diagnostics: [],
        })
        // @ts-expect-error testing purpose
        compiler._makeTransformers = jest.fn().mockReturnValueOnce(transformersStub)
        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM,
          watchMode: false,
        })

        const usedCompilerOptions = mockTsTranspileModule.mock.calls[0][1].compilerOptions as ts.CompilerOptions
        expect(mockTsTranspileModule).toHaveBeenCalled()
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
        mockTsTranspileModule.mockReturnValueOnce(compileOutput)
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

      it.each(['Node16', 'NodeNext'] as const)('should use tsTranspileModule when %s is used', (module) => {
        const compiler = makeCompiler({
          tsJestConfig: {
            ...baseTsJestConfig,
            tsconfig: {
              isolatedModules: true,
              module,
              moduleResolution: module,
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
          // moduleResolution Bundler supports customConditions; the user's value
          // flows through unchanged.
          expectedCustomConditions: ['my-condition'],
        },
        {
          useESM: true,
          supportsStaticESM: false,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
          // CJS path (useESM but no static ESM support) with forced module: CommonJS.
          // Bundler is incompatible with CommonJS on TypeScript ≤ 5 (TS5095), so
          // the option is left unset for TypeScript to resolve.
          expectedModuleResolution: undefined,
          // The TypeScript default does not support customConditions (TS5098), so
          // the option is cleared.
          expectedCustomConditions: undefined,
        },
        {
          useESM: false,
          supportsStaticESM: true,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
          // Same CJS-path substitution as above.
          expectedModuleResolution: undefined,
          expectedCustomConditions: undefined,
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
          expectedCustomConditions,
        }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM,
              tsconfig: {
                module: moduleValue as TsConfigJson.CompilerOptions['module'],
                esModuleInterop: false,
                customConditions: ['my-condition'],
                moduleResolution: 'Bundler',
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
          expect(usedCompilerOptions.customConditions).toEqual(expectedCustomConditions)
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
              moduleResolution: 'Bundler',
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
        // moduleResolution Bundler supports customConditions; the user's value
        // (`['my-condition']` set above) flows through unchanged.
        expect(usedCompilerOptions.customConditions).toEqual(['my-condition'])
        // baseTsJestConfig points at ts-jest's own tsconfig.json which sets
        // moduleResolution to Bundler. After #4198 the compiler preserves that value
        // instead of forcing it to Node10 — see fixupCompilerOptionsForModuleKind.
        expect(usedCompilerOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler)
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
      // tightly to a small set of compatible resolutions on TS < 6:
      //   - Node10 / Classic: pass through (always valid with CommonJS)
      //   - Node16 / NodeNext: leave unset (TS5110 forbids them with CommonJS)
      //   - Bundler: leave unset (TS5095 forbids CommonJS+Bundler on TS < 6)
      // The TS >= 6 path is covered separately below.
      test.each([
        { moduleResolutionValue: 'Bundler', expectedKind: undefined },
        { moduleResolutionValue: 'Node16', expectedKind: undefined },
        { moduleResolutionValue: 'NodeNext', expectedKind: undefined },
        { moduleResolutionValue: 'Classic', expectedKind: ts.ModuleResolutionKind.Classic },
        { moduleResolutionValue: 'Node10', expectedKind: ts.ModuleResolutionKind.Node10 },
      ])(
        'should resolve user-supplied moduleResolution %p compatibly for non-ESM compilation on TypeScript < 6',
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

      // TS 6 relaxed TS5095 to allow `module: CommonJS` paired with
      // `moduleResolution: Bundler`. The CJS path now honors that: user-supplied
      // Bundler is preserved instead of substituted to Node10, and Node16/NodeNext
      // substitute to Bundler (matching the ESM-path substitution above) rather
      // than Node10. The TS version is simulated by handing the compiler a ts-like
      // proxy whose `version` reports 6.x; the real `ts` module is untouched.
      test.each([
        { moduleResolutionValue: 'Bundler', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'Node16', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'NodeNext', expectedKind: ts.ModuleResolutionKind.Bundler },
        { moduleResolutionValue: 'Classic', expectedKind: ts.ModuleResolutionKind.Classic },
        { moduleResolutionValue: 'Node10', expectedKind: ts.ModuleResolutionKind.Node10 },
      ])(
        'should resolve user-supplied moduleResolution %p compatibly for non-ESM compilation on TypeScript >= 6',
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
          // @ts-expect-error testing purpose: replace the ts reference on this compiler
          compiler._ts = { ...ts, version: '6.0.0' } as unknown as typeof ts
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

      test.each([
        { moduleValue: 'CommonJS', useESM: false, supportsStaticESM: false },
        { moduleValue: 'ESNext', useESM: true, supportsStaticESM: true },
      ])(
        'should leave moduleResolution unset when it is omitted for module=%p',
        ({ moduleValue, useESM, supportsStaticESM }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              useESM,
              tsconfig: {
                module: moduleValue as TsConfigJson.CompilerOptions['module'],
                moduleResolution: undefined,
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
            supportsStaticESM,
            watchMode: false,
          })

          // @ts-expect-error testing purpose
          expect(compiler._compilerOptions.moduleResolution).toBeUndefined()
        },
      )

      // TypeScript pairs `moduleResolution: bundler` only with the ES-module
      // module kinds (`ES2015` / `ES2020` / `ES2022` / `ESNext`) or `Preserve`.
      // Pairing it with `CommonJS`, `AMD`, `UMD`, `System`, or `None` raises
      // TS5095 — verified empirically on TypeScript 5.9.3 with `tsc -p` against
      // each `module` value. These tests pin the compatibility check that gates
      // the Node16/NodeNext substitution and the user-supplied Bundler
      // pass-through, so neither path emits an invalid pair when the user's
      // `module` is non-ES.
      describe('moduleResolution compatibility — Bundler-incompatible module kinds', () => {
        const incompatibleKinds = [
          ['AMD', ts.ModuleKind.AMD],
          ['UMD', ts.ModuleKind.UMD],
          ['System', ts.ModuleKind.System],
          ['None', ts.ModuleKind.None],
          ['CommonJS', ts.ModuleKind.CommonJS],
        ] as const

        const remappedToDefault = [
          ['Node16', ts.ModuleResolutionKind.Node16],
          ['NodeNext', ts.ModuleResolutionKind.NodeNext],
          ['Bundler', ts.ModuleResolutionKind.Bundler],
        ] as const

        test.each(
          incompatibleKinds.flatMap(([moduleName, moduleKind]) =>
            remappedToDefault.map(([resolutionName, userResolution]) => ({
              moduleName,
              moduleKind,
              resolutionName,
              userResolution,
            })),
          ),
        )(
          'leaves moduleResolution unset when forced module=$moduleName is paired with user resolution=$resolutionName',
          ({ moduleKind, userResolution }) => {
            const configSet = createConfigSet({ tsJestConfig: baseTsJestConfig })
            const compiler = new TsCompiler(configSet, new Map())
            // @ts-expect-error testing purpose: invoking a private method directly
            const resolved = compiler.resolveCompatibleModuleResolution(moduleKind, userResolution)
            expect(resolved).toBeUndefined()
          },
        )

        test.each(incompatibleKinds)(
          'preserves explicitly compatible user resolution (Node10 / Classic) on forced module=%s',
          (_moduleName, moduleKind) => {
            const configSet = createConfigSet({ tsJestConfig: baseTsJestConfig })
            const compiler = new TsCompiler(configSet, new Map())
            for (const userKind of [ts.ModuleResolutionKind.Node10, ts.ModuleResolutionKind.Classic]) {
              // @ts-expect-error testing purpose: invoking a private method directly
              const resolved = compiler.resolveCompatibleModuleResolution(moduleKind, userKind)
              expect(resolved).toBe(userKind)
            }
          },
        )
      })

      // Positive coverage for the Bundler-compatible side of the same
      // compatibility check. ES-family modules + `Preserve` (TS 5.4+) are the
      // only kinds TypeScript accepts alongside `moduleResolution: bundler`,
      // so Node16/NodeNext should substitute to Bundler and explicitly-set
      // Bundler should pass through unchanged.
      describe('moduleResolution compatibility — Bundler-compatible module kinds', () => {
        const compatibleKinds = [
          ['ES2015', ts.ModuleKind.ES2015] as const,
          ['ES2020', ts.ModuleKind.ES2020] as const,
          ['ES2022', ts.ModuleKind.ES2022] as const,
          ['ESNext', ts.ModuleKind.ESNext] as const,
          ['Preserve', ts.ModuleKind.Preserve] as const,
        ] as const

        test.each(
          compatibleKinds.flatMap(([moduleName, moduleKind]) =>
            [
              ['Node16', ts.ModuleResolutionKind.Node16],
              ['NodeNext', ts.ModuleResolutionKind.NodeNext],
              ['Bundler', ts.ModuleResolutionKind.Bundler],
            ].map(([resolutionName, userResolution]) => ({
              moduleName,
              moduleKind,
              resolutionName,
              userResolution,
            })),
          ),
        )(
          'resolves to Bundler when forced module=$moduleName paired with user resolution=$resolutionName',
          ({ moduleKind, userResolution }) => {
            const configSet = createConfigSet({ tsJestConfig: baseTsJestConfig })
            const compiler = new TsCompiler(configSet, new Map())
            // @ts-expect-error testing purpose: invoking a private method directly
            const resolved = compiler.resolveCompatibleModuleResolution(moduleKind, userResolution)
            expect(resolved).toBe(ts.ModuleResolutionKind.Bundler)
          },
        )

        test.each(compatibleKinds)(
          'preserves Node10 / Classic as the user-supplied value on forced module=%s',
          (_moduleName, moduleKind) => {
            const configSet = createConfigSet({ tsJestConfig: baseTsJestConfig })
            const compiler = new TsCompiler(configSet, new Map())
            for (const userKind of [ts.ModuleResolutionKind.Node10, ts.ModuleResolutionKind.Classic]) {
              // @ts-expect-error testing purpose: invoking a private method directly
              const resolved = compiler.resolveCompatibleModuleResolution(moduleKind, userKind)
              expect(resolved).toBe(userKind)
            }
          },
        )
      })

      // End-to-end coverage that walks the full `getCompiledOutput` path with
      // a non-ES `module` selection. Pins that `fixupCompilerOptionsForModuleKind`
      // produces a TypeScript-valid `module` + `moduleResolution` pair (no
      // TS5095 in real consumer compilation) when the user has selected
      // `module: AMD` and a modern `moduleResolution`.
      test('full flow: module=AMD + moduleResolution=NodeNext leaves moduleResolution unset', () => {
        const configSet = createConfigSet({
          tsJestConfig: {
            ...baseTsJestConfig,
            useESM: true,
            tsconfig: {
              module: 'AMD',
              moduleResolution: 'NodeNext',
              esModuleInterop: false,
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

        expect(usedCompilerOptions.module).toBe(ts.ModuleKind.AMD)
        expect(usedCompilerOptions.moduleResolution).toBeUndefined()
      })

      // `customConditions` is only valid alongside `moduleResolution: bundler`,
      // `node16`, or `nodenext` — TypeScript raises TS5098 otherwise (verified
      // empirically against TypeScript 5.9.3 with `tsc -p`). Before #4198 the
      // surrounding `fixupCompilerOptionsForModuleKind` cleared
      // `customConditions` must flow through when the resolved
      // `moduleResolution` is `Bundler` and be cleared for TypeScript defaults
      // that do not support it. These tests pin both directions.
      describe('customConditions preservation', () => {
        function buildCompilerWithCustomConditions(
          moduleValue: TsConfigJson.CompilerOptions['module'],
          moduleResolutionValue: TsConfigJson.CompilerOptions['moduleResolution'],
          useESM: boolean,
          supportsStaticESM: boolean,
          compilerVersion = ts.version,
        ): { compiler: TsCompiler; usedCompilerOptions: ts.CompilerOptions } {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM,
              tsconfig: {
                module: moduleValue,
                moduleResolution: moduleResolutionValue,
                customConditions: ['my-condition'],
              },
            },
          })
          const emptyFile = join(mockFolder, 'empty.ts')
          configSet.parsedTsConfig.fileNames.push(emptyFile)
          const compiler = new TsCompiler(configSet, new Map())
          // @ts-expect-error testing purpose: exercise version-dependent compiler behavior
          compiler._ts = { ...ts, version: compilerVersion } as unknown as typeof ts
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
            outputFiles: [{ text: sourceMap }, { text: jsOutput }],
            emitSkipped: false,
          } as ts.EmitOutput)
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])

          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM,
            watchMode: false,
          })

          // @ts-expect-error testing purpose
          return { compiler, usedCompilerOptions: compiler._compilerOptions }
        }

        // ESM path with an ES-family forced module: the substitution lands on
        // `Bundler`, which supports `customConditions` — preserve it.
        test.each([
          ['ESNext', 'NodeNext'],
          ['ESNext', 'Node16'],
          ['ESNext', 'Bundler'],
        ] as const)(
          'preserves customConditions on ESM path when module=%p + user resolution=%p resolves to Bundler',
          (moduleValue, resolutionValue) => {
            const { usedCompilerOptions } = buildCompilerWithCustomConditions(
              moduleValue as TsConfigJson.CompilerOptions['module'],
              resolutionValue as TsConfigJson.CompilerOptions['moduleResolution'],
              true,
              true,
            )
            expect(usedCompilerOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler)
            expect(usedCompilerOptions.customConditions).toEqual(['my-condition'])
          },
        )

        // ESM path with a non-ES forced module (AMD/UMD/System/None): the
        // substitution leaves moduleResolution unset, which does NOT support
        // `customConditions` — clear it to avoid TS5098 in real consumer
        // compilation.
        test.each([
          ['AMD', 'NodeNext'],
          ['UMD', 'NodeNext'],
          ['System', 'Node16'],
          ['None', 'Bundler'],
        ] as const)(
          'clears customConditions on ESM path when module=%p + user resolution=%p uses TypeScript defaults',
          (moduleValue, resolutionValue) => {
            const { usedCompilerOptions } = buildCompilerWithCustomConditions(
              moduleValue as TsConfigJson.CompilerOptions['module'],
              resolutionValue as TsConfigJson.CompilerOptions['moduleResolution'],
              true,
              true,
            )
            expect(usedCompilerOptions.moduleResolution).toBeUndefined()
            expect(usedCompilerOptions.customConditions).toBeUndefined()
          },
        )

        // CJS path: forced module is `CommonJS`, which is not in the
        // Bundler-compatible allowlist on the supported TS range, so the
        // omitted resolution does not support `customConditions`, so clear it.
        test.each([
          ['CommonJS', 'NodeNext', undefined],
          ['CommonJS', 'Bundler', undefined],
          ['CommonJS', 'Node10', ts.ModuleResolutionKind.Node10],
        ] as const)(
          'clears customConditions on CJS path when module=%p + user resolution=%p',
          (moduleValue, resolutionValue, expectedResolution) => {
            const { usedCompilerOptions } = buildCompilerWithCustomConditions(
              moduleValue as TsConfigJson.CompilerOptions['module'],
              resolutionValue as TsConfigJson.CompilerOptions['moduleResolution'],
              false,
              false,
            )
            expect(usedCompilerOptions.moduleResolution).toBe(expectedResolution)
            expect(usedCompilerOptions.customConditions).toBeUndefined()
          },
        )

        test.each([
          ['5.9.3', undefined],
          ['6.0.2', ['my-condition']],
        ] as const)(
          'preserves omitted-resolution customConditions only when TypeScript supports the effective default (%s)',
          (compilerVersion, expectedCustomConditions) => {
            const { usedCompilerOptions } = buildCompilerWithCustomConditions(
              'CommonJS',
              undefined,
              false,
              false,
              compilerVersion,
            )

            expect(usedCompilerOptions.moduleResolution).toBeUndefined()
            expect(usedCompilerOptions.customConditions).toEqual(expectedCustomConditions)
          },
        )

        test.each([
          ['5.4.5', ['my-condition']],
          ['5.9.3', ['my-condition']],
          ['6.0.2', ['my-condition']],
        ] as const)(
          'preserves omitted-resolution customConditions for module=Preserve on TypeScript %s',
          (compilerVersion, expectedCustomConditions) => {
            const { usedCompilerOptions } = buildCompilerWithCustomConditions(
              'Preserve',
              undefined,
              true,
              true,
              compilerVersion,
            )

            expect(usedCompilerOptions.moduleResolution).toBeUndefined()
            expect(usedCompilerOptions.customConditions).toEqual(expectedCustomConditions)
          },
        )

        // Direct unit test for the helper — pins the TypeScript-rule mapping
        // independently of the call sites, so a future change to the helper
        // (e.g. adding the TS6 CommonJS+Bundler relaxation) doesn't have to
        // re-discover which resolution kinds support customConditions.
        test('preserveCustomConditionsIfCompatible returns input only for Bundler / Node16 / NodeNext', () => {
          const compiler = new TsCompiler(createConfigSet({ tsJestConfig: baseTsJestConfig }), new Map())
          const userValue = ['my-condition']
          const supportedCases: ReadonlyArray<readonly [ts.ModuleResolutionKind, string[]]> = [
            [ts.ModuleResolutionKind.Bundler, userValue],
            [ts.ModuleResolutionKind.Node16, userValue],
            [ts.ModuleResolutionKind.NodeNext, userValue],
          ]
          const unsupportedCases: ReadonlyArray<readonly [ts.ModuleResolutionKind, undefined]> = [
            [ts.ModuleResolutionKind.Node10, undefined],
            [ts.ModuleResolutionKind.Classic, undefined],
          ]
          const cases = [...supportedCases, ...unsupportedCases]
          for (const [resolved, expected] of cases) {
            // @ts-expect-error testing purpose: invoking a private method directly
            const result = compiler.preserveCustomConditionsIfCompatible(resolved, userValue, ts.ModuleKind.ESNext)
            expect(result).toEqual(expected)
          }
        })

        test('preserveCustomConditionsIfCompatible returns undefined when user did not set customConditions', () => {
          const compiler = new TsCompiler(createConfigSet({ tsJestConfig: baseTsJestConfig }), new Map())
          const definedResolutionKinds = [
            ts.ModuleResolutionKind.Bundler,
            ts.ModuleResolutionKind.Node16,
            ts.ModuleResolutionKind.NodeNext,
            ts.ModuleResolutionKind.Node10,
            ts.ModuleResolutionKind.Classic,
          ]
          for (const resolved of definedResolutionKinds) {
            // @ts-expect-error testing purpose: invoking a private method directly
            const result = compiler.preserveCustomConditionsIfCompatible(resolved, undefined, ts.ModuleKind.ESNext)
            expect(result).toBeUndefined()
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

      describe('cross-compile module kind tracking', () => {
        const targetFile = join(mockFolder, 'thing.ts')
        const otherFile = join(mockFolder, 'thing1.ts')
        const stubbedEmit = {
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: false,
        } as ts.EmitOutput

        function buildCompiler(): TsCompiler {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM: true,
              tsconfig: { module: 'ESNext' } as TsConfigJson,
            },
          })
          configSet.parsedTsConfig.fileNames.push(targetFile)
          const compiler = new TsCompiler(configSet, new Map())
          // @ts-expect-error testing purpose
          compiler._languageService.getEmitOutput = jest.fn().mockReturnValue(stubbedEmit)
          // @ts-expect-error testing purpose
          compiler.getDiagnostics = jest.fn().mockReturnValue([])
          // Pre-seed so the only bump trigger left is the module-kind-change check.
          // @ts-expect-error testing purpose
          compiler._fileContentCache.set(targetFile, fileContent)
          // @ts-expect-error testing purpose
          compiler._fileVersionCache.set(targetFile, 1)

          return compiler
        }

        test('should bump project version when consecutive compiles produce different module kinds', () => {
          const compiler = buildCompiler()
          compiler.getCompiledOutput('const a = 1', otherFile, {
            depGraphs: new Map(),
            supportsStaticESM: false,
            watchMode: false,
          })
          // @ts-expect-error testing purpose
          expect(compiler._compilerOptions.module).toBe(ts.ModuleKind.CommonJS)
          // @ts-expect-error testing purpose
          const versionAfterFirstCompile = compiler._projectVersion

          compiler.getCompiledOutput(fileContent, targetFile, {
            depGraphs: new Map(),
            supportsStaticESM: true,
            watchMode: false,
          })
          // @ts-expect-error testing purpose
          expect(compiler._compilerOptions.module).toBe(ts.ModuleKind.ESNext)

          // @ts-expect-error testing purpose
          expect(compiler._projectVersion).toBeGreaterThan(versionAfterFirstCompile)
        })

        test('should not bump project version when consecutive compiles share the same module kind', () => {
          const compiler = buildCompiler()
          compiler.getCompiledOutput(fileContent, targetFile, {
            depGraphs: new Map(),
            supportsStaticESM: true,
            watchMode: false,
          })
          // @ts-expect-error testing purpose
          expect(compiler._compilerOptions.module).toBe(ts.ModuleKind.ESNext)
          // @ts-expect-error testing purpose
          const versionAfterFirstCompile = compiler._projectVersion

          compiler.getCompiledOutput(fileContent, targetFile, {
            depGraphs: new Map(),
            supportsStaticESM: true,
            watchMode: false,
          })
          // @ts-expect-error testing purpose
          expect(compiler._compilerOptions.module).toBe(ts.ModuleKind.ESNext)

          // @ts-expect-error testing purpose
          expect(compiler._projectVersion).toBe(versionAfterFirstCompile)
        })
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
