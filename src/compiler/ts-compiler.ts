import { LogContexts, LogLevels, Logger } from 'bs-logger'
import { basename, join, normalize, relative } from 'path'
import { existsSync, readFileSync, writeFile } from 'fs'
import memoize from 'lodash.memoize'
import mkdirp from 'mkdirp'
import type {
  EmitOutput,
  LanguageService,
  LanguageServiceHost,
  ParsedCommandLine,
  ResolvedModuleFull,
  TranspileOutput,
} from 'typescript'

import { updateOutput } from './compiler-utils'
import type { ConfigSet } from '../config/config-set'
import { LINE_FEED } from '../constants'
import type { CompilerInstance, TTypeScript } from '../types'
import { rootLogger } from '../utils/logger'
import { parse, stringify } from '../utils/json'
import { Errors, interpolate } from '../utils/messages'
import { sha1 } from '../utils/sha1'

/** where key is filepath */
type TSFiles = Map<string, TSFile>

interface TSFile {
  text?: string
  version: number
}

interface MemoryCache {
  resolvedModules: Map<string, string[]>
  files: TSFiles
}

/**
 * @internal
 */
export class TsCompiler implements CompilerInstance {
  private readonly _logger: Logger
  private readonly _ts: TTypeScript
  private readonly _parsedTsConfig: ParsedCommandLine
  private readonly _memoryHost: MemoryCache = {
    files: new Map<string, TSFile>(),
    resolvedModules: new Map<string, string[]>(),
  }
  private readonly _diagnosedFiles: string[] = []
  private _cachedReadFile: any
  private _projectVersion = 1
  private _tsResolvedModulesCachePath: string | undefined
  private _languageService: LanguageService | undefined

  constructor(private readonly configSet: ConfigSet) {
    this._ts = configSet.compilerModule
    this._logger = rootLogger.child({ namespace: 'ts-compiler' })
    this._parsedTsConfig = this.configSet.parsedTsConfig as ParsedCommandLine
    if (!this.configSet.isolatedModules) {
      this._createLanguageService()
    }
  }

  private _createLanguageService(): void {
    const cacheDir = this.configSet.tsCacheDir
    const serviceHostTraceCtx = {
      namespace: 'ts:serviceHost',
      call: null,
      [LogContexts.logLevel]: LogLevels.trace,
    }
    if (cacheDir) {
      // Make sure the cache directory exists before continuing.
      mkdirp.sync(cacheDir)
      this._tsResolvedModulesCachePath = join(cacheDir, sha1('ts-jest-resolved-modules', '\x00'))
      try {
        /* istanbul ignore next (already covered with unit test) */
        const cachedTSResolvedModules = readFileSync(this._tsResolvedModulesCachePath, 'utf-8')
        this._memoryHost.resolvedModules = new Map(parse(cachedTSResolvedModules))
      } catch (e) {}
    }
    // Initialize memory cache for typescript compiler
    this._parsedTsConfig.fileNames
      .filter((fileName) => !this.configSet.isTestFile(fileName))
      .forEach((fileName) => {
        this._memoryHost.files.set(fileName, {
          version: 0,
        })
      })
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
      this._parsedTsConfig.options,
    )
    /* istanbul ignore next */
    const serviceHost: LanguageServiceHost = {
      getProjectVersion: () => String(this._projectVersion),
      getScriptFileNames: () => [...this._memoryHost.files.keys()],
      getScriptVersion: (fileName: string) => {
        const normalizedFileName = normalize(fileName)
        const version = this._memoryHost.files.get(normalizedFileName)?.version

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
          this._memoryHost.files.set(normalizedFileName, {
            text: this._cachedReadFile(normalizedFileName),
            version: 1,
          })
        }
        const contents = this._memoryHost.files.get(normalizedFileName)?.text

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
      getCompilationSettings: () => this._parsedTsConfig.options,
      getDefaultLibFileName: () => this._ts.getDefaultLibFilePath(this._parsedTsConfig.options),
      getCustomTransformers: () => this.configSet.customTransformers,
      resolveModuleNames: (moduleNames: string[], containingFile: string): (ResolvedModuleFull | undefined)[] => {
        const normalizedContainingFile = normalize(containingFile)
        const currentResolvedModules = this._memoryHost.resolvedModules.get(normalizedContainingFile) ?? []

        return moduleNames.map((moduleName) => {
          const resolveModuleName = this._ts.resolveModuleName(
            moduleName,
            containingFile,
            this._parsedTsConfig.options,
            moduleResolutionHost,
            moduleResolutionCache,
          )
          const resolvedModule = resolveModuleName.resolvedModule
          if (this.configSet.isTestFile(normalizedContainingFile) && resolvedModule) {
            const normalizedResolvedFileName = normalize(resolvedModule.resolvedFileName)
            if (!currentResolvedModules.includes(normalizedResolvedFileName)) {
              currentResolvedModules.push(normalizedResolvedFileName)
              this._memoryHost.resolvedModules.set(normalizedContainingFile, currentResolvedModules)
            }
          }

          return resolvedModule
        })
      },
    }

    this._logger.debug('created language service')

    this._languageService = this._ts.createLanguageService(serviceHost, this._ts.createDocumentRegistry())
  }

  getCompiledOutput(fileContent: string, fileName: string): string {
    if (this._languageService) {
      this._logger.debug({ fileName }, 'getCompiledOutput(): compiling using language service')

      // Must set memory cache before attempting to compile
      this._updateMemoryCache(fileContent, fileName)
      const output: EmitOutput = this._languageService.getEmitOutput(fileName)
      /* istanbul ignore next */
      if (this._tsResolvedModulesCachePath) {
        // Cache resolved modules to disk so next run can reuse it
        void (async () => {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await writeFile(
            this._tsResolvedModulesCachePath as string,
            stringify([...this._memoryHost.resolvedModules]),
            () => {},
          )
        })()
      }
      /**
       * There might be a chance that test files are type checked even before jest executes them, we don't need to do
       * type check again
       */
      if (!this._diagnosedFiles.includes(fileName)) {
        this._logger.debug({ fileName }, 'getCompiledOutput(): computing diagnostics using language service')

        this._doTypeChecking(fileName)
      }
      /* istanbul ignore next (already covered with unit tests) */
      if (!this.configSet.isTestFile(fileName)) {
        for (const [testFileName, resolvedModules] of this._memoryHost.resolvedModules.entries()) {
          // Only do type checking for test files which haven't been type checked before as well as the file must exist
          if (
            resolvedModules.includes(fileName) &&
            !this._diagnosedFiles.includes(testFileName) &&
            existsSync(testFileName)
          ) {
            const testFileContent = this._memoryHost.files.get(testFileName)?.text
            if (!testFileContent) {
              // Must set memory cache before attempting to get diagnostics
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              this._updateMemoryCache(this._cachedReadFile(testFileName)!, testFileName)
            }

            this._logger.debug(
              { testFileName },
              'getCompiledOutput(): computing diagnostics using language service for test file which uses the module',
            )

            this._doTypeChecking(testFileName)
          }
        }
      }
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
        compilerOptions: this._parsedTsConfig.options,
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._memoryHost.files.has(fileName) && this._memoryHost.files.get(fileName)!.version !== 0
  }

  /* istanbul ignore next */
  private _updateMemoryCache(contents: string, fileName: string): void {
    this._logger.debug({ fileName }, 'updateMemoryCache: update memory cache for language service')

    let shouldIncrementProjectVersion = false
    const hit = this._isFileInCache(fileName)
    if (!hit) {
      this._memoryHost.files.set(fileName, {
        text: contents,
        version: 1,
      })
      shouldIncrementProjectVersion = true
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cachedFileName = this._memoryHost.files.get(fileName)!
      const previousContents = cachedFileName.text
      // Avoid incrementing cache when nothing has changed.
      if (previousContents !== contents) {
        this._memoryHost.files.set(fileName, {
          text: contents,
          version: cachedFileName.version + 1,
        })
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
      this._diagnosedFiles.push(fileName)
      // will raise or just warn diagnostics depending on config
      this.configSet.raiseDiagnostics(diagnostics, fileName, this._logger)
    }
  }
}
