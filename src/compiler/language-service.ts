import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompileResult, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

const hasOwn = Object.prototype.hasOwnProperty

/**
 * @internal
 */
export const compileUsingLanguageService = (
  configs: ConfigSet,
  logger: Logger,
  memoryCache: MemoryCache,
): CompileResult => {
  logger.debug('compileUsingLanguageService(): create typescript compiler')

  const ts = configs.compilerModule,
    cwd = configs.cwd,
    { options } = configs.typescript,
    serviceHostTraceCtx = {
      namespace: 'ts:serviceHost',
      call: null,
      [LogContexts.logLevel]: LogLevels.trace,
    }
  // Set the file contents into cache.
  const updateMemoryCache = (code: string, fileName: string) => {
    logger.debug({ fileName }, `updateMemoryCache(): update memory cache for language service`)

    const fileVersion = memoryCache.versions[fileName] ?? 0,
      isFileInCache = fileVersion !== 0
    if (!isFileInCache) {
      memoryCache.versions[fileName] = 1
    }
    if (memoryCache.contents[fileName] !== code) {
      memoryCache.contents[fileName] = code
      memoryCache.versions[fileName] = (memoryCache.versions[fileName] || 0) + 1
    }
  }
  const serviceHost: _ts.LanguageServiceHost = {
    getScriptFileNames: () => Object.keys(memoryCache.versions),
    getScriptVersion: (fileName: string) => {
      const normalizedFileName = normalize(fileName),
        version = memoryCache.versions[normalizedFileName]

      // We need to return `undefined` and not a string here because TypeScript will use
      // `getScriptVersion` and compare against their own version - which can be `undefined`.
      // If we don't return `undefined` it results in `undefined === "undefined"` and run
      // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
      // TypeScript errors from the function signature (expects `(x: string) => string`).
      return version === undefined ? ((undefined as any) as string) : String(version)
    },
    getScriptSnapshot(fileName: string) {
      const normalizedFileName = normalize(fileName),
        hit = hasOwn.call(memoryCache.contents, normalizedFileName)

      logger.trace({ normalizedFileName, cacheHit: hit }, `getScriptSnapshot():`, 'cache', hit ? 'hit' : 'miss')

      // Read contents from TypeScript memory cache.
      if (!hit) {
        memoryCache.contents[normalizedFileName] = ts.sys.readFile(normalizedFileName)
      }
      const contents = memoryCache.contents[normalizedFileName]
      if (contents === undefined) {
        return
      }

      return ts.ScriptSnapshot.fromString(contents)
    },
    fileExists: memoize(ts.sys.fileExists),
    readFile: logger.wrap(serviceHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
    readDirectory: memoize(ts.sys.readDirectory),
    getDirectories: memoize(ts.sys.getDirectories),
    directoryExists: memoize(ts.sys.directoryExists),
    realpath: memoize(ts.sys.realpath!),
    getNewLine: () => '\n',
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
      if (configs.shouldReportDiagnostic(normalizedFileName)) {
        logger.debug({ normalizedFileName }, 'compileFn(): computing diagnostics for language service')

        // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
        const diagnostics = service
          .getCompilerOptionsDiagnostics()
          .concat(service.getSyntacticDiagnostics(normalizedFileName))
          .concat(service.getSemanticDiagnostics(normalizedFileName))
        // will raise or just warn diagnostics depending on config
        configs.raiseDiagnostics(diagnostics, normalizedFileName, logger)
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
