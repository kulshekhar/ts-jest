import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { LINE_FEED } from '../constants'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

import { cacheResolvedModules, hasOwn, isTestFile } from './compiler-utils'

function doTypeChecking(configs: ConfigSet, fileName: string, service: _ts.LanguageService, logger: Logger) {
  if (configs.shouldReportDiagnostic(fileName)) {
    // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
    const diagnostics = service.getSemanticDiagnostics(fileName).concat(service.getSyntacticDiagnostics(fileName))
    // will raise or just warn diagnostics depending on config
    configs.raiseDiagnostics(diagnostics, fileName, logger)
  }
}

/**
 * @internal
 */
export const compileUsingLanguageService = (
  configs: ConfigSet,
  logger: Logger,
  memoryCache: MemoryCache,
): CompilerInstance => {
  logger.debug('compileUsingLanguageService(): create typescript compiler')

  const ts = configs.compilerModule
  const cwd = configs.cwd
  const cacheDir = configs.tsCacheDir
  const { options } = configs.typescript
  const serviceHostTraceCtx = {
    namespace: 'ts:serviceHost',
    call: null,
    [LogContexts.logLevel]: LogLevels.trace,
  }
  let projectVersion = 1
  // Set the file contents into cache.
  const updateMemoryCache = (contents: string, fileName: string) => {
    logger.debug({ fileName }, `updateMemoryCache(): update memory cache for language service`)

    let shouldIncrementProjectVersion = false
    const fileVersion = memoryCache.versions[fileName] ?? 0
    const isFileInCache = fileVersion !== 0
    if (!isFileInCache) {
      memoryCache.versions[fileName] = 1
      shouldIncrementProjectVersion = true
    }
    const previousContents = memoryCache.contents[fileName]
    // Avoid incrementing cache when nothing has changed.
    if (previousContents !== contents) {
      memoryCache.versions[fileName] = fileVersion + 1
      memoryCache.contents[fileName] = contents
      // Only bump project version when file is modified in cache, not when discovered for the first time
      if (isFileInCache) shouldIncrementProjectVersion = true
    }

    if (shouldIncrementProjectVersion) projectVersion++
  }
  const serviceHost: _ts.LanguageServiceHost = {
    getProjectVersion: () => String(projectVersion),
    getScriptFileNames: () => Object.keys(memoryCache.versions),
    getScriptVersion: (fileName: string) => {
      const normalizedFileName = normalize(fileName)
      const version = memoryCache.versions[normalizedFileName]

      // We need to return `undefined` and not a string here because TypeScript will use
      // `getScriptVersion` and compare against their own version - which can be `undefined`.
      // If we don't return `undefined` it results in `undefined === "undefined"` and run
      // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
      // TypeScript errors from the function signature (expects `(x: string) => string`).
      return version === undefined ? ((undefined as any) as string) : String(version)
    },
    getScriptSnapshot(fileName: string) {
      const normalizedFileName = normalize(fileName)
      const hit = hasOwn.call(memoryCache.contents, normalizedFileName)

      logger.trace({ normalizedFileName, cacheHit: hit }, `getScriptSnapshot():`, 'cache', hit ? 'hit' : 'miss')

      // Read contents from TypeScript memory cache.
      if (!hit) memoryCache.contents[normalizedFileName] = ts.sys.readFile(normalizedFileName)
      const contents = memoryCache.contents[normalizedFileName]

      if (contents === undefined) return

      return ts.ScriptSnapshot.fromString(contents)
    },
    fileExists: memoize(ts.sys.fileExists),
    readFile: logger.wrap(serviceHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
    readDirectory: memoize(ts.sys.readDirectory),
    getDirectories: memoize(ts.sys.getDirectories),
    directoryExists: memoize(ts.sys.directoryExists),
    realpath: memoize(ts.sys.realpath!),
    getNewLine: () => LINE_FEED,
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => options,
    getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
    getCustomTransformers: () => configs.tsCustomTransformers,
  }

  logger.debug('compileUsingLanguageService(): creating language service')
  const service: _ts.LanguageService = ts.createLanguageService(serviceHost)

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName)

      logger.debug({ normalizedFileName }, 'compileFn(): compiling using language service')
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, normalizedFileName)
      const output: _ts.EmitOutput = service.getEmitOutput(normalizedFileName)
      // Do type checking by getting TypeScript diagnostics
      logger.debug(`diagnoseFn(): computing diagnostics for ${normalizedFileName} using language service`)

      doTypeChecking(configs, normalizedFileName, service, logger)
      /**
       * We don't need the following logic with no cache run because no cache always gives correct typing
       */
      if (cacheDir) {
        if (isTestFile(configs.testMatchPatterns, normalizedFileName)) {
          cacheResolvedModules(normalizedFileName, code, memoryCache, service.getProgram()!, cacheDir, logger)
        } else {
          /* istanbul ignore next (covered by e2e) */
          Object.entries(memoryCache.resolvedModules)
            .filter(entry => {
              /**
               * When imported modules change, we only need to check whether the test file is compiled previously or not
               * base on memory cache. By checking memory cache, we can avoid repeatedly doing type checking against
               * test file for 1st time run after clearing cache because
               */
              return (
                entry[1].modulePaths.find(modulePath => modulePath === normalizedFileName) &&
                !hasOwn.call(memoryCache.outputs, entry[0])
              )
            })
            .forEach(entry => {
              logger.debug(
                `diagnoseFn(): computing diagnostics for test file that imports ${normalizedFileName} using language service`,
              )

              const testFileName = entry[0]
              updateMemoryCache(entry[1].testFileContent, testFileName)
              doTypeChecking(configs, testFileName, service, logger)
            })
        }
      }
      /* istanbul ignore next (this should never happen but is kept for security) */
      if (output.emitSkipped) {
        throw new TypeError(`${relative(cwd, normalizedFileName)}: Emit skipped for language service`)
      }
      // Throw an error when requiring `.d.ts` files.
      if (!output.outputFiles.length) {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(normalizedFileName),
          }),
        )
      }

      return [output.outputFiles[1].text, output.outputFiles[0].text]
    },
    program: service.getProgram(),
  }
}
