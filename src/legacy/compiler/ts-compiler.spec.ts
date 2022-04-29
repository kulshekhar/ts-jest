import { readFileSync } from 'fs'
import { basename, join, normalize } from 'path'

import { type CompilerOptions, DiagnosticCategory, type EmitOutput, type TranspileOutput } from 'typescript'

import { createConfigSet, makeCompiler } from '../../__helpers__/fakers'
import type { DepGraphInfo } from '../../types'
import { Errors, interpolate } from '../../utils/messages'

import { updateOutput } from './compiler-utils'
import { TsCompiler } from './ts-compiler'

const mockFolder = join(process.cwd(), 'src', '__mocks__')

const baseTsJestConfig = { tsconfig: join(process.cwd(), 'tsconfig.spec.json') }

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
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: true,
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: false,
        },
        {
          useESM: false,
          babelConfig: false,
          supportsStaticESM: true,
        },
      ])('should transpile code with config %p', ({ useESM, babelConfig, supportsStaticESM }) => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig, isolatedModules: true, useESM, babelConfig },
        })
        const transformersStub = {
          before: [],
          after: [],
          afterDeclarations: [],
        }
        // @ts-expect-error testing purpose
        const transpileMock = (compiler._ts.transpileModule = jest.fn().mockReturnValueOnce({
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
        }).toMatchSnapshot()
      })

      test.each([true, false])('should report diagnostics if shouldReportDiagnostics is %p', (shouldReport) => {
        const compiler = makeCompiler({
          tsJestConfig: { ...baseTsJestConfig, isolatedModules: true, useESM: false },
        })
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockReturnValue(shouldReport)
        const compileOutput: TranspileOutput = {
          sourceMapText: '{}',
          outputText: 'var bar = 1',
          diagnostics: [
            {
              category: DiagnosticCategory.Error,
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
    })

    describe('isolatedModules false', () => {
      const fileName = join(mockFolder, 'thing.ts')
      const fileContent = 'const bar = 1'
      const jsOutput = 'var bar = 1'
      const sourceMap = '{}'

      test.each([
        {
          useESM: true,
          babelConfig: true,
          supportsStaticESM: false,
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: true,
        },
        {
          useESM: true,
          babelConfig: false,
          supportsStaticESM: false,
        },
        {
          useESM: false,
          babelConfig: false,
          supportsStaticESM: true,
        },
      ])('should compile codes with useESM %p', ({ useESM, babelConfig, supportsStaticESM }) => {
        const configSet = createConfigSet({
          tsJestConfig: { ...baseTsJestConfig, useESM, babelConfig },
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
        compiler._doTypeChecking = jest.fn()

        const output = compiler.getCompiledOutput(fileContent, fileName, {
          depGraphs: new Map(),
          supportsStaticESM,
          watchMode: false,
        })

        // @ts-expect-error testing purpose
        const usedCompilerOptions = compiler._compilerOptions
        expect({
          module: usedCompilerOptions.module,
          esModuleInterop: usedCompilerOptions.esModuleInterop,
          allowSyntheticDefaultImports: usedCompilerOptions.allowSyntheticDefaultImports,
        }).toMatchSnapshot()
        expect(output).toEqual({
          code: updateOutput(jsOutput, fileName, sourceMap),
        })

        // @ts-expect-error testing purpose
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        compiler._languageService!.getSemanticDiagnostics(fileName)

        // @ts-expect-error testing purpose
        expect(compiler._fileContentCache.has(emptyFile)).toBe(true)
      })

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
        compiler._doTypeChecking = jest.fn()
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
          compiler._doTypeChecking = jest.fn()

          // @ts-expect-error testing purpose
          expect(compiler._logger.warn).not.toHaveBeenCalled()
          expect(() =>
            compiler.getCompiledOutput(fileContent, fileToCheck, {
              depGraphs: new Map(),
              supportsStaticESM: false,
              watchMode: false,
            }),
          ).toThrowError()
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
        compiler._doTypeChecking = jest.fn()

        expect(() =>
          compiler.getCompiledOutput(fileContent, fileName, {
            depGraphs: new Map(),
            supportsStaticESM: false,
            watchMode: false,
          }),
        ).toThrowError(
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
        tsJestConfig: { ...baseTsJestConfig, isolatedModules: true, useESM: false },
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
      tsJestConfig: { ...baseTsJestConfig, isolatedModules: true },
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

  describe('_doTypeChecking', () => {
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
            category: DiagnosticCategory.Error,
            code: 123,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
          {
            category: DiagnosticCategory.Error,
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

    test.each([true, false])(
      'should/should not report diagnostics in watch mode when shouldReportDiagnostics is %p ' +
        'and processing file is used by other files',
      (shouldReport) => {
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
            category: DiagnosticCategory.Error,
            code: 123,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
          {
            category: DiagnosticCategory.Error,
            code: 456,
            messageText: 'An error occurs',
            file: undefined,
            start: 0,
            length: 1,
          },
        ]
        compiler.configSet.raiseDiagnostics = jest.fn()
        compiler.configSet.shouldReportDiagnostics = jest.fn().mockImplementation((fileToCheck) => {
          return fileToCheck === fileName1 ? shouldReport : false
        })
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

        if (shouldReport) {
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSemanticDiagnostics).toHaveBeenCalledWith(fileName1)
          // @ts-expect-error testing purpose
          expect(compiler._languageService?.getSyntacticDiagnostics).toHaveBeenCalledWith(fileName1)
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
