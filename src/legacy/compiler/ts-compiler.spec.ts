import { readFileSync } from 'fs'
import { basename, join, normalize } from 'path'

import { LogLevels } from 'bs-logger'
import type { TsConfigJson } from 'type-fest'
import type { CompilerOptions, EmitOutput, transpileModule, TranspileOutput } from 'typescript'
import ts from 'typescript'

import { createConfigSet, makeCompiler } from '../../__helpers__/fakers'
import { logTargetMock } from '../../__helpers__/mocks'
import type { RawCompilerOptions } from '../../raw-compiler-options'
import { tsTranspileModule } from '../../transpilers/typescript/transpile-module'
import type { DepGraphInfo } from '../../types'
import { Errors, interpolate } from '../../utils/messages'

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

const baseTsJestConfig = { tsconfig: join(process.cwd(), 'tsconfig.json') }

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
        } as TranspileOutput))
        // @ts-expect-error testing purpose
        compiler._makeTransformers = jest.fn().mockReturnValueOnce(transformersStub)
        compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM,
          watchMode: false,
        })

        const usedCompilerOptions = transpileMock.mock.calls[0][1].compilerOptions as CompilerOptions
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
        const compileOutput: TranspileOutput = {
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
        },
        {
          useESM: true,
          supportsStaticESM: true,
          moduleValue: 'NodeNext',
          expectedModule: ts.ModuleKind.ESNext,
          expectedEsModuleInterop: true,
        },
        {
          useESM: true,
          supportsStaticESM: false,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
        },
        {
          useESM: false,
          supportsStaticESM: true,
          moduleValue: 'ESNext',
          expectedModule: ts.ModuleKind.CommonJS,
          expectedEsModuleInterop: false,
        },
      ])(
        'should compile codes with useESM %p',
        ({ useESM, supportsStaticESM, moduleValue, expectedModule, expectedEsModuleInterop }) => {
          const configSet = createConfigSet({
            tsJestConfig: {
              ...baseTsJestConfig,
              useESM,
              tsconfig: {
                module: moduleValue as unknown as RawCompilerOptions['module'],
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
          } as EmitOutput)
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
          expect(usedCompilerOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Node10)
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

      test('should show a warning message and return original file content for non ts/tsx files if emitSkipped is true', () => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig },
        })
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: true,
        } as EmitOutput)
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
          } as EmitOutput)
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
          tsJestConfig: { ...baseTsJestConfig },
        })
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [],
          emitSkipped: false,
        } as EmitOutput)
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
          tsJestConfig: baseTsJestConfig,
        })
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(shouldReport)
        // @ts-expect-error testing purpose
        compiler._languageService.getEmitOutput = jest.fn().mockReturnValueOnce({
          outputFiles: [{ text: sourceMap }, { text: jsOutput }],
          emitSkipped: false,
        } as EmitOutput)
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
          tsJestConfig: { ...baseTsJestConfig, useESM: false },
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
        } as EmitOutput)
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
        tsJestConfig: baseTsJestConfig,
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
      } as EmitOutput)
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
  })
})
