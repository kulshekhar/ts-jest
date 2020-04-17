import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { LINE_FEED } from '../constants'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

import { cacheResolvedModules, hasOwn, isTestFile } from './compiler-utils'

function doTypeChecking(configs: ConfigSet, fileName: string, program: _ts.Program, logger: Logger) {
  if (configs.shouldReportDiagnostic(fileName)) {
    const sourceFile = program.getSourceFile(fileName)
    const diagnostics = program.getSemanticDiagnostics(sourceFile).concat(program.getSyntacticDiagnostics(sourceFile))
    // will raise or just warn diagnostics depending on config
    configs.raiseDiagnostics(diagnostics, fileName, logger)
  }
}

/**
 * @internal
 */
export const compileUsingProgram = (configs: ConfigSet, logger: Logger, memoryCache: MemoryCache): CompilerInstance => {
  logger.debug('compileUsingProgram(): create typescript compiler')

  const ts = configs.compilerModule
  const cwd = configs.cwd
  const { options, projectReferences, errors } = configs.typescript
  const cacheDir = configs.tsCacheDir
  const compilerHostTraceCtx = {
    namespace: 'ts:compilerHost',
    call: null,
    [LogContexts.logLevel]: LogLevels.trace,
  }
  const sys = {
    ...ts.sys,
    readFile: logger.wrap(compilerHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
    readDirectory: memoize(ts.sys.readDirectory),
    getDirectories: memoize(ts.sys.getDirectories),
    fileExists: memoize(ts.sys.fileExists),
    directoryExists: memoize(ts.sys.directoryExists),
    resolvePath: memoize(ts.sys.resolvePath),
    realpath: memoize(ts.sys.realpath!),
    getCurrentDirectory: () => cwd,
    getNewLine: () => LINE_FEED,
    getCanonicalFileName: (fileName: string) => (ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()),
  }
  const host: _ts.CompilerHost = ts.createIncrementalCompilerHost(options, sys)
  let builderProgram: _ts.EmitAndSemanticDiagnosticsBuilderProgram = ts.createIncrementalProgram({
    rootNames: Object.keys(memoryCache.versions),
    options,
    host,
    configFileParsingDiagnostics: errors,
    projectReferences,
  })
  let program = builderProgram.getProgram()
  // Read and cache custom transformers.
  const customTransformers = configs.tsCustomTransformers
  const updateMemoryCache = (contents: string, fileName: string): void => {
    logger.debug({ fileName }, `updateMemoryCache(): update memory cache for incremental program`)

    const sourceFile = builderProgram.getSourceFile(fileName)
    const fileVersion = memoryCache.versions[fileName] ?? 0
    const isFileInCache = fileVersion !== 0
    if (!isFileInCache) {
      memoryCache.versions[fileName] = 1
    }
    const previousContents = memoryCache.contents[fileName]
    // Avoid incrementing cache when nothing has changed.
    if (previousContents !== contents) {
      memoryCache.versions[fileName] = fileVersion + 1
      memoryCache.contents[fileName] = contents
    }
    // Update program when file changes.
    if (
      sourceFile === undefined ||
      sourceFile.text !== contents ||
      program.isSourceFileFromExternalLibrary(sourceFile)
    ) {
      const programOptions = {
        rootNames: Object.keys(memoryCache.versions),
        options,
        host,
        configFileParsingDiagnostics: errors,
        projectReferences,
      }
      builderProgram = ts.createIncrementalProgram(programOptions)
      program = builderProgram.getProgram()
    }
  }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName)
      const output: [string, string] = ['', '']
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, normalizedFileName)
      const sourceFile = builderProgram.getSourceFile(normalizedFileName)

      if (!sourceFile) throw new TypeError(`Unable to read file: ${fileName}`)

      logger.debug({ normalizedFileName }, `compileFn(): compiling using incremental program`)

      const result: _ts.EmitResult = builderProgram.emit(
        sourceFile,
        (path, file, _writeByteOrderMark) => {
          output[path.endsWith('.map') ? 1 : 0] = file
        },
        undefined,
        undefined,
        customTransformers,
      )
      // Do type checking by getting TypeScript diagnostics
      logger.debug(`diagnoseFn(): computing diagnostics for ${normalizedFileName} using incremental program`)

      doTypeChecking(configs, normalizedFileName, program, logger)
      /**
       * We don't need the following logic with no cache run because no cache always gives correct typing
       */
      if (cacheDir) {
        if (isTestFile(configs.testMatchPatterns, normalizedFileName)) {
          cacheResolvedModules(normalizedFileName, code, memoryCache, program, cacheDir, logger)
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
                `diagnoseFn(): computing diagnostics for test file that imports ${normalizedFileName} using incremental program`,
              )

              doTypeChecking(configs, entry[0], program, logger)
            })
        }
      }
      if (result.emitSkipped) {
        throw new TypeError(`${relative(cwd, fileName)}: Emit skipped`)
      }

      // Throw an error when requiring files that cannot be compiled.
      if (output[0] === '') {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(normalizedFileName),
          }),
        )
      }

      return output
    },
    program,
  }
}
