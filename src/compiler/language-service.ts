import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { TypeInfo } from '../types'
import { Errors, interpolate } from '../util/messages'

import { CompileResult, MemoryCacheV2, SourceOutput } from './compiler-types'

/**
 * @internal
 */
export const compileUsingLanguageService = (
  configs: ConfigSet,
  logger: Logger,
  memoryCache: MemoryCacheV2,
): CompileResult => {
  logger.debug('compileUsingLanguageService()')

  const ts = configs.compilerModule
  const cwd = configs.cwd
  const customTransformers = configs.tsCustomTransformers
  const { options, fileNames } = configs.typescript
  // Create the compiler host for type checking.
  const serviceHostDebugCtx = {
    [LogContexts.logLevel]: LogLevels.debug,
    namespace: 'ts:serviceHost',
    call: null,
  }
  const serviceHostTraceCtx = {
    ...serviceHostDebugCtx,
    [LogContexts.logLevel]: LogLevels.trace,
  }
  let projectVersion = 1
  const serviceHost: _ts.LanguageServiceHost = {
    getProjectVersion: () => `${projectVersion}`,
    getScriptFileNames: () => fileNames,
    getScriptVersion: (fileName: string) => {
      const normalizedFileName = normalize(fileName)
      const version = memoryCache.versions.get(normalizedFileName)

      // We need to return `undefined` and not a string here because TypeScript will use
      // `getScriptVersion` and compare against their own version - which can be `undefined`.
      // If we don't return `undefined` it results in `undefined === "undefined"` and run
      // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
      // TypeScript errors from the function signature (expects `(x: string) => string`).
      return version === undefined ? ((undefined as any) as string) : String(version)
    },
    getScriptSnapshot(fileName: string) {
      const normalizedFileName = normalize(fileName)
      const hit = memoryCache.contents.has(normalizedFileName)
      logger.trace({ normalizedFileName, cacheHit: hit }, `getScriptSnapshot():`, 'cache', hit ? 'hit' : 'miss')
      // Read contents from TypeScript memory cache.
      if (!hit) {
        memoryCache.contents.set(normalizedFileName, ts.sys.readFile(normalizedFileName))
      }
      const contents = memoryCache.contents.get(normalizedFileName)
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
    realpath: ts.sys.realpath ? memoize(ts.sys.realpath) : undefined,
    getNewLine: () => '\n',
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => options,
    getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
    getCustomTransformers: () => {
      if (typeof customTransformers === 'function') {
        const program = service.getProgram()

        return program ? customTransformers(program) : undefined
      }

      return customTransformers
    },
  }

  logger.debug('compileUsingLanguageService(): creating language service')

  const service: _ts.LanguageService = ts.createLanguageService(serviceHost)
  const updateMemoryCache = (contents: string, normalizedFileName: string): void => {
    let shouldIncrementProjectVersion = false
    logger.debug({ normalizedFileName }, `updateMemoryCache() for language service`)

    const fileVersion = memoryCache.versions.get(normalizedFileName) ?? 0
    const isFileInCache = fileVersion !== 0
    if (!isFileInCache) {
      fileNames.push(normalizedFileName)
      // Modifying rootFileNames means a project change
      shouldIncrementProjectVersion = true
    }
    if (memoryCache.contents.get(normalizedFileName) !== contents) {
      memoryCache.versions.set(normalizedFileName, fileVersion + 1)
      memoryCache.contents.set(normalizedFileName, contents)
      // Only bump project version when file is modified in cache, not when discovered for the first time
      if (isFileInCache) {
        shouldIncrementProjectVersion = true
      }
    }

    if (shouldIncrementProjectVersion) projectVersion++
  }
  let previousProgram: _ts.Program | undefined

  return {
    getOutput: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName)
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, normalizedFileName)
      const programBefore = service.getProgram()

      if (programBefore !== previousProgram) {
        logger.debug({ normalizedFileName }, `compiler rebuilt Program instance when getting output`)
      }

      const output: _ts.EmitOutput = service.getEmitOutput(normalizedFileName)
      if (configs.shouldReportDiagnostic(normalizedFileName)) {
        logger.debug({ normalizedFileName }, 'getOutput(): computing diagnostics for language service')
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

      const programAfter = service.getProgram()

      logger.debug(
        'invariant: Is service.getProject() identical before and after getting emit output and diagnostics? (should always be true) ',
        programBefore === programAfter,
      )

      previousProgram = programAfter

      // Throw an error when requiring `.d.ts` files.
      /* istanbul ignore next (this should never happen but is kept for security) */
      if (!output.outputFiles.length) {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(normalizedFileName),
          }),
        )
      }

      return [output.outputFiles[1].text, output.outputFiles[0].text]
    },
    getTypeInfo: (code: string, fileName: string, position: number): TypeInfo => {
      const normalizedFileName = normalize(fileName)
      updateMemoryCache(code, normalizedFileName)
      const info = service.getQuickInfoAtPosition(normalizedFileName, position)
      const name = ts.displayPartsToString(info ? info.displayParts : [])
      const comment = ts.displayPartsToString(info ? info.documentation : [])

      return { name, comment }
    },
  }
}
