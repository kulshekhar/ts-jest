import { basename, normalize, relative } from 'path'

import { LogContexts, Logger, LogLevels } from 'bs-logger'
import memoize from 'lodash/memoize'
import type {
  EmitOutput,
  LanguageService,
  LanguageServiceHost,
  ParsedCommandLine,
  ResolvedModuleFull,
  TranspileOutput,
  CompilerOptions,
} from 'typescript'

import type { ConfigSet } from '../config/config-set'
import { LINE_FEED } from '../constants'
import type { CompilerInstance, ResolvedModulesMap, StringMap, TTypeScript } from '../types'
import { rootLogger } from '../utils/logger'
import { Errors, interpolate } from '../utils/messages'

import { updateOutput } from './compiler-utils'

/**
 * @internal
 */
export class TsCompiler implements CompilerInstance {
  private readonly _logger: Logger
  private readonly _ts: TTypeScript
  private readonly _parsedTsConfig: ParsedCommandLine
  private readonly _compilerCacheFS: Map<string, number> = new Map<string, number>()
  private readonly _jestCacheFS: StringMap
  private _compilerOptions: CompilerOptions
  private _cachedReadFile: ((fileName: string) => string | undefined) | undefined
  private _projectVersion = 1
  private _languageService: LanguageService | undefined

  constructor(readonly configSet: ConfigSet, readonly jestCacheFS: StringMap) {
    this._ts = configSet.compilerModule
    this._logger = rootLogger.child({ namespace: 'ts-compiler' })
    this._parsedTsConfig = this.configSet.parsedTsConfig as ParsedCommandLine
    this._jestCacheFS = jestCacheFS
    this._compilerOptions = { ...this._parsedTsConfig.options, module: this._ts.ModuleKind.CommonJS }
    if (!this.configSet.isolatedModules) {
      this._createLanguageService()
    }
  }

  private _createLanguageService(): void {
    const serviceHostTraceCtx = {
      namespace: 'ts:serviceHost',
      call: null,
      [LogContexts.logLevel]: LogLevels.trace,
    }
    // Initialize memory cache for typescript compiler
    this._parsedTsConfig.fileNames
      .filter((fileName) => !this.configSet.isTestFile(fileName))
      .forEach((fileName) => this._compilerCacheFS.set(fileName, 0))
    this._cachedReadFile = this._logger.wrap(serviceHostTraceCtx, 'readFile', memoize(this._ts.sys.readFile))
    /* istanbul ignore next */
    const moduleResolutionHost = {
      fileExists: memoize(this._ts.sys.fileExists),
      readFile: this._cachedReadFile,
      directoryExists: memoize(this._ts.sys.directoryExists),
      getCurrentDirectory: () => this.configSet.cwd,
      realpath: this._ts.sys.realpath && memoize(this._ts.sys.realpath),
      getDirectories: memoize(this._ts.sys.getDirectories),
    }
    const moduleResolutionCache = this._ts.createModuleResolutionCache(
      this.configSet.cwd,
      (x) => x,
      this._compilerOptions,
    )
    /* istanbul ignore next */
    const serviceHost: LanguageServiceHost = {
      getProjectVersion: () => String(this._projectVersion),
      getScriptFileNames: () => [...this._compilerCacheFS.keys()],
      getScriptVersion: (fileName: string) => {
        const normalizedFileName = normalize(fileName)
        const version = this._compilerCacheFS.get(normalizedFileName)

        // We need to return `undefined` and not a string here because TypeScript will use
        // `getScriptVersion` and compare against their own version - which can be `undefined`.
        // If we don't return `undefined` it results in `undefined === "undefined"` and run
        // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
        // TypeScript errors from the function signature (expects `(x: string) => string`).
        return version === undefined ? ((undefined as any) as string) : String(version)
      },
      getScriptSnapshot: (fileName: string) => {
        const normalizedFileName = normalize(fileName)
        const hit = this._isFileInCache(normalizedFileName)

        this._logger.trace({ normalizedFileName, cacheHit: hit }, 'getScriptSnapshot():', 'cache', hit ? 'hit' : 'miss')

        // Read contents from TypeScript memory cache.
        if (!hit) {
          const fileContent =
            this._jestCacheFS.get(normalizedFileName) ?? this._cachedReadFile?.(normalizedFileName) ?? undefined
          if (fileContent) {
            this._jestCacheFS.set(normalizedFileName, fileContent)
            this._compilerCacheFS.set(normalizedFileName, 1)
          }
        }
        const contents = this._jestCacheFS.get(normalizedFileName)

        if (contents === undefined) return

        return this._ts.ScriptSnapshot.fromString(contents)
      },
      fileExists: memoize(this._ts.sys.fileExists),
      readFile: this._cachedReadFile,
      readDirectory: memoize(this._ts.sys.readDirectory),
      getDirectories: memoize(this._ts.sys.getDirectories),
      directoryExists: memoize(this._ts.sys.directoryExists),
      realpath: this._ts.sys.realpath && memoize(this._ts.sys.realpath),
      getNewLine: () => LINE_FEED,
      getCurrentDirectory: () => this.configSet.cwd,
      getCompilationSettings: () => this._compilerOptions,
      getDefaultLibFileName: () => this._ts.getDefaultLibFilePath(this._compilerOptions),
      getCustomTransformers: () => this.configSet.customTransformers,
      resolveModuleNames: (moduleNames: string[], containingFile: string): (ResolvedModuleFull | undefined)[] =>
        moduleNames.map((moduleName) => {
          const { resolvedModule } = this._ts.resolveModuleName(
            moduleName,
            containingFile,
            this._compilerOptions,
            moduleResolutionHost,
            moduleResolutionCache,
          )

          return resolvedModule
        }),
    }

    this._logger.debug('created language service')

    this._languageService = this._ts.createLanguageService(serviceHost, this._ts.createDocumentRegistry())
  }

  getResolvedModulesMap(fileContent: string, fileName: string): ResolvedModulesMap {
    this._updateMemoryCache(fileContent, fileName)

    // See https://github.com/microsoft/TypeScript/blob/master/src/compiler/utilities.ts#L164
    return (this._languageService?.getProgram()?.getSourceFile(fileName) as any)?.resolvedModules
  }

  getCompiledOutput(fileContent: string, fileName: string, supportsStaticESM: boolean): string {
    const initialCompilerOptions = { ...this._parsedTsConfig.options }
    let moduleKind = initialCompilerOptions.module
    let esModuleInterop = initialCompilerOptions.esModuleInterop
    let allowSyntheticDefaultImports = initialCompilerOptions.allowSyntheticDefaultImports
    if (supportsStaticESM && this.configSet.useESM) {
      moduleKind =
        !moduleKind ||
        (moduleKind &&
          ![this._ts.ModuleKind.ES2015, this._ts.ModuleKind.ES2020, this._ts.ModuleKind.ESNext].includes(moduleKind))
          ? this._ts.ModuleKind.ESNext
          : moduleKind
      // Make sure `esModuleInterop` and `allowSyntheticDefaultImports` true to support import CJS into ESM
      esModuleInterop = true
      allowSyntheticDefaultImports = true
    } else {
      moduleKind = this._ts.ModuleKind.CommonJS
    }
    this._compilerOptions = {
      ...this._compilerOptions,
      allowSyntheticDefaultImports,
      esModuleInterop,
      module: moduleKind,
    }
    if (this._languageService) {
      this._logger.debug({ fileName }, 'getCompiledOutput(): compiling using language service')

      // Must set memory cache before attempting to compile
      this._updateMemoryCache(fileContent, fileName)
      const output: EmitOutput = this._languageService.getEmitOutput(fileName)

      this._logger.debug({ fileName }, 'getCompiledOutput(): computing diagnostics using language service')

      this._doTypeChecking(fileName)
      /* istanbul ignore next (this should never happen but is kept for security) */
      if (output.emitSkipped) {
        throw new TypeError(`${relative(this.configSet.cwd, fileName)}: Emit skipped for language service`)
      }
      // Throw an error when requiring `.d.ts` files.
      if (!output.outputFiles.length) {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(fileName),
          }),
        )
      }

      return updateOutput(output.outputFiles[1].text, fileName, output.outputFiles[0].text)
    } else {
      this._logger.debug({ fileName }, 'getCompiledOutput(): compiling as isolated module')

      const result: TranspileOutput = this._ts.transpileModule(fileContent, {
        fileName,
        transformers: this.configSet.customTransformers,
        compilerOptions: this._compilerOptions,
        reportDiagnostics: this.configSet.shouldReportDiagnostics(fileName),
      })
      if (result.diagnostics && this.configSet.shouldReportDiagnostics(fileName)) {
        this.configSet.raiseDiagnostics(result.diagnostics, fileName, this._logger)
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return updateOutput(result.outputText, fileName, result.sourceMapText!)
    }
  }

  private _isFileInCache(fileName: string): boolean {
    return (
      this._jestCacheFS.has(fileName) &&
      this._compilerCacheFS.has(fileName) &&
      this._compilerCacheFS.get(fileName) !== 0
    )
  }

  /* istanbul ignore next */
  private _updateMemoryCache(contents: string, fileName: string): void {
    this._logger.debug({ fileName }, 'updateMemoryCache: update memory cache for language service')

    let shouldIncrementProjectVersion = false
    const hit = this._isFileInCache(fileName)
    if (!hit) {
      this._compilerCacheFS.set(fileName, 1)
      shouldIncrementProjectVersion = true
    } else {
      const prevVersion = this._compilerCacheFS.get(fileName) ?? 0
      const previousContents = this._jestCacheFS.get(fileName)
      // Avoid incrementing cache when nothing has changed.
      if (previousContents !== contents) {
        this._compilerCacheFS.set(fileName, prevVersion + 1)
        // Only bump project version when file is modified in cache, not when discovered for the first time
        if (hit) shouldIncrementProjectVersion = true
      }
      /**
       * When a file is from node_modules or referenced to a referenced project and jest wants to transform it, we need
       * to make sure that the Program is updated with this information
       */
      if (!this._parsedTsConfig.fileNames.includes(fileName)) {
        shouldIncrementProjectVersion = true
      }
    }

    if (shouldIncrementProjectVersion) this._projectVersion++
  }

  private _doTypeChecking(fileName: string): void {
    if (this.configSet.shouldReportDiagnostics(fileName)) {
      // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const diagnostics = this._languageService!.getSemanticDiagnostics(fileName).concat(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this._languageService!.getSyntacticDiagnostics(fileName),
      )
      // will raise or just warn diagnostics depending on config
      this.configSet.raiseDiagnostics(diagnostics, fileName, this._logger)
    }
  }
}
