import { LogContexts, Logger, LogLevels } from 'bs-logger'
import { existsSync, readFileSync, writeFile } from 'fs'
import { basename, normalize, join, extname } from 'path'
import memoize = require('lodash/memoize')
import mkdirp = require('mkdirp')
import type * as _ts from 'typescript'

import type { ConfigSet } from '../config/config-set'
import { LINE_FEED, TS_TSX_REGEX } from '../constants'
import type { CompilerInstance, SourceOutput } from '../types'
import { Errors, interpolate } from '../utils/messages'

import { parse, stringify } from '../utils/json'
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

function doTypeChecking(
  configs: ConfigSet,
  diagnosedFiles: string[],
  fileName: string,
  service: _ts.LanguageService,
  logger: Logger,
): void {
  if (configs.shouldReportDiagnostics(fileName)) {
    // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
    const diagnostics = service.getSemanticDiagnostics(fileName).concat(service.getSyntacticDiagnostics(fileName))
    diagnosedFiles.push(fileName)
    // will raise or just warn diagnostics depending on config
    configs.raiseDiagnostics(diagnostics, fileName, logger)
  }
}

/**
 * @internal
 */
export const initializeLanguageServiceInstance = (configs: ConfigSet, logger: Logger): CompilerInstance => {
  logger.debug('initializeLanguageServiceInstance(): create typescript compiler')

  const ts = configs.compilerModule
  const cwd = configs.cwd
  const cacheDir = configs.tsCacheDir
  const { options, fileNames } = configs.parsedTsConfig
  const diagnosedFiles: string[] = []
  const serviceHostTraceCtx = {
    namespace: 'ts:serviceHost',
    call: null,
    [LogContexts.logLevel]: LogLevels.trace,
  }
  const memoryCache: MemoryCache = {
    files: new Map<string, TSFile>(),
    resolvedModules: new Map<string, string[]>(),
  }
  let tsResolvedModulesCachePath: string | undefined
  if (cacheDir) {
    // Make sure the cache directory exists before continuing.
    mkdirp.sync(cacheDir)
    tsResolvedModulesCachePath = join(cacheDir, sha1('ts-jest-resolved-modules', '\x00'))
    try {
      /* istanbul ignore next (already covered with unit test) */
      const cachedTSResolvedModules = readFileSync(tsResolvedModulesCachePath, 'utf-8')
      memoryCache.resolvedModules = new Map(parse(cachedTSResolvedModules))
    } catch (e) {}
  }
  // Initialize memory cache for typescript compiler
  configs.parsedTsConfig.fileNames
    .filter((fileName: string) => TS_TSX_REGEX.test(extname(fileName)) && !configs.isTestFile(fileName))
    .forEach((fileName: string) => {
      memoryCache.files.set(fileName, {
        version: 0,
      })
    })
  function isFileInCache(fileName: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return memoryCache.files.has(fileName) && memoryCache.files.get(fileName)!.version !== 0
  }
  const cacheReadFile = logger.wrap(serviceHostTraceCtx, 'readFile', memoize(ts.sys.readFile))
  /* istanbul ignore next */
  const moduleResolutionHost: _ts.ModuleResolutionHost = {
    fileExists: memoize(ts.sys.fileExists),
    readFile: cacheReadFile,
    directoryExists: memoize(ts.sys.directoryExists),
    getCurrentDirectory: () => cwd,
    realpath: ts.sys.realpath && memoize(ts.sys.realpath),
    getDirectories: memoize(ts.sys.getDirectories),
  }
  const moduleResolutionCache = ts.createModuleResolutionCache(cwd, (x) => x, options)
  function resolveModuleNames(moduleNames: string[], containingFile: string): (_ts.ResolvedModuleFull | undefined)[] {
    const normalizedContainingFile = normalize(containingFile)
    const currentResolvedModules = memoryCache.resolvedModules.get(normalizedContainingFile) ?? []

    return moduleNames.map((moduleName) => {
      const resolveModuleName = ts.resolveModuleName(
        moduleName,
        containingFile,
        options,
        moduleResolutionHost,
        moduleResolutionCache,
      )
      const resolvedModule = resolveModuleName.resolvedModule
      if (configs.isTestFile(normalizedContainingFile) && resolvedModule) {
        const normalizedResolvedFileName = normalize(resolvedModule.resolvedFileName)
        if (!currentResolvedModules.includes(normalizedResolvedFileName)) {
          currentResolvedModules.push(normalizedResolvedFileName)
          memoryCache.resolvedModules.set(normalizedContainingFile, currentResolvedModules)
        }
      }

      return resolvedModule
    })
  }

  let projectVersion = 1
  // Set the file contents into cache.
  /* istanbul ignore next (cover by e2e) */
  const updateMemoryCache = (contents: string, fileName: string) => {
    logger.debug({ fileName }, 'updateMemoryCache(): update memory cache for language service')

    let shouldIncrementProjectVersion = false
    const hit = isFileInCache(fileName)
    if (!hit) {
      memoryCache.files.set(fileName, {
        text: contents,
        version: 1,
      })
      shouldIncrementProjectVersion = true
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const previousContents = memoryCache.files.get(fileName)!.text
      // Avoid incrementing cache when nothing has changed.
      if (previousContents !== contents) {
        memoryCache.files.set(fileName, {
          text: contents,
          version: memoryCache.files.get(fileName)!.version + 1, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        })
        // Only bump project version when file is modified in cache, not when discovered for the first time
        if (hit) shouldIncrementProjectVersion = true
      }
      /**
       * When a file is from node_modules or referenced to a referenced project and jest wants to transform it, we need
       * to make sure that the Program is updated with this information
       */
      if (!fileNames.includes(fileName)) {
        shouldIncrementProjectVersion = true
      }
    }

    if (shouldIncrementProjectVersion) projectVersion++
  }
  const serviceHost: _ts.LanguageServiceHost = {
    getProjectVersion: () => String(projectVersion),
    getScriptFileNames: () => [...memoryCache.files.keys()],
    getScriptVersion: (fileName: string) => {
      const normalizedFileName = normalize(fileName)
      const version = memoryCache.files.get(normalizedFileName)?.version

      // We need to return `undefined` and not a string here because TypeScript will use
      // `getScriptVersion` and compare against their own version - which can be `undefined`.
      // If we don't return `undefined` it results in `undefined === "undefined"` and run
      // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
      // TypeScript errors from the function signature (expects `(x: string) => string`).
      return version === undefined ? ((undefined as any) as string) : String(version)
    },
    getScriptSnapshot(fileName: string) {
      const normalizedFileName = normalize(fileName)
      const hit = isFileInCache(normalizedFileName)

      logger.trace({ normalizedFileName, cacheHit: hit }, 'getScriptSnapshot():', 'cache', hit ? 'hit' : 'miss')

      // Read contents from TypeScript memory cache.
      if (!hit) {
        memoryCache.files.set(normalizedFileName, {
          text: cacheReadFile(normalizedFileName),
          version: 1,
        })
      }
      const contents = memoryCache.files.get(normalizedFileName)?.text

      if (contents === undefined) return

      return ts.ScriptSnapshot.fromString(contents)
    },
    fileExists: memoize(ts.sys.fileExists),
    readFile: cacheReadFile,
    readDirectory: memoize(ts.sys.readDirectory),
    getDirectories: memoize(ts.sys.getDirectories),
    directoryExists: memoize(ts.sys.directoryExists),
    realpath: ts.sys.realpath && memoize(ts.sys.realpath),
    getNewLine: () => LINE_FEED,
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => options,
    getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
    getCustomTransformers: () => configs.customTransformers,
    resolveModuleNames,
  }

  logger.debug('initializeLanguageServiceInstance(): creating language service')

  const service: _ts.LanguageService = ts.createLanguageService(serviceHost, ts.createDocumentRegistry())

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      logger.debug({ fileName }, 'compileFn(): compiling using language service')

      // Must set memory cache before attempting to compile
      updateMemoryCache(code, fileName)
      const output: _ts.EmitOutput = service.getEmitOutput(fileName)
      /* istanbul ignore next */
      if (tsResolvedModulesCachePath) {
        // Cache resolved modules to disk so next run can reuse it
        void (async () => {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await writeFile(tsResolvedModulesCachePath, stringify([...memoryCache.resolvedModules]), () => {})
        })()
      }
      /**
       * There might be a chance that test files are type checked even before jest executes them, we don't need to do
       * type check again
       */
      if (!diagnosedFiles.includes(fileName)) {
        logger.debug({ fileName }, 'compileFn(): computing diagnostics using language service')

        doTypeChecking(configs, diagnosedFiles, fileName, service, logger)
      }
      /* istanbul ignore next (already covered with unit tests) */
      if (!configs.isTestFile(fileName)) {
        for (const [testFileName, resolvedModules] of memoryCache.resolvedModules.entries()) {
          // Only do type checking for test files which haven't been type checked before as well as the file must exist
          if (
            resolvedModules.includes(fileName) &&
            !diagnosedFiles.includes(testFileName) &&
            existsSync(testFileName)
          ) {
            const testFileContent = memoryCache.files.get(testFileName)?.text
            if (!testFileContent) {
              // Must set memory cache before attempting to get diagnostics
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              updateMemoryCache(cacheReadFile(testFileName)!, testFileName)
            }

            logger.debug(
              { testFileName },
              'compileFn(): computing diagnostics using language service for test file which uses the module',
            )

            doTypeChecking(configs, diagnosedFiles, testFileName, service, logger)
          }
        }
      }
      /* istanbul ignore next (this should never happen but is kept for security) */
      if (output.emitSkipped) {
        if (TS_TSX_REGEX.test(fileName)) {
          throw new Error(interpolate(Errors.CannotProcessFile, { file: fileName }))
        } else {
          logger.warn(interpolate(Errors.CannotProcessFileReturnOriginal, { file: fileName }))

          return [code, '{}']
        }
      }
      // Throw an error when requiring `.d.ts` files.
      if (!output.outputFiles.length) {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(fileName),
          }),
        )
      }

      return [output.outputFiles[1].text, output.outputFiles[0].text]
    },
    program: service.getProgram(),
  }
}
