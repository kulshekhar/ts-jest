import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

const hasOwn = Object.prototype.hasOwnProperty

/**
 * @internal
 */
export const compileUsingProgram = (configs: ConfigSet, logger: Logger, memoryCache: MemoryCache): CompilerInstance => {
  logger.debug('compileUsingProgram(): create typescript compiler')

  const ts = configs.compilerModule,
    cwd = configs.cwd,
    { options, projectReferences, errors } = configs.typescript,
    incremental = configs.tsJest.incremental
  const compilerHostTraceCtx = {
      namespace: 'ts:compilerHost',
      call: null,
      [LogContexts.logLevel]: LogLevels.trace,
    },
    sys = {
      ...ts.sys,
      readFile: logger.wrap(compilerHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
      readDirectory: memoize(ts.sys.readDirectory),
      getDirectories: memoize(ts.sys.getDirectories),
      fileExists: memoize(ts.sys.fileExists),
      directoryExists: memoize(ts.sys.directoryExists),
      resolvePath: memoize(ts.sys.resolvePath),
      realpath: memoize(ts.sys.realpath!),
      getCurrentDirectory: () => cwd,
      getNewLine: () => '\n',
      getCanonicalFileName: (fileName: string) =>
        ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    }
  let builderProgram: _ts.EmitAndSemanticDiagnosticsBuilderProgram, program: _ts.Program, host: _ts.CompilerHost
  if (incremental) {
    host = ts.createIncrementalCompilerHost(options, sys)
    builderProgram = ts.createIncrementalProgram({
      rootNames: Object.keys(memoryCache.versions),
      options,
      host,
      configFileParsingDiagnostics: errors,
      projectReferences,
    })
    program = builderProgram.getProgram()
  } else {
    // Fallback for older TypeScript releases without incremental API.
    host = {
      ...sys,
      getSourceFile: (fileName, languageVersion) => {
        const contents = ts.sys.readFile(fileName)

        if (contents === undefined) return

        return ts.createSourceFile(fileName, contents, languageVersion)
      },
      getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
      useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames,
    }
    program = ts.createProgram({
      rootNames: Object.keys(memoryCache.versions),
      options,
      host,
      configFileParsingDiagnostics: errors,
      projectReferences,
    })
  }
  // Read and cache custom transformers.
  const customTransformers = configs.tsCustomTransformers,
    updateMemoryCache = (code: string, fileName: string): void => {
      logger.debug(
        { fileName },
        `updateMemoryCache(): update memory cache for ${incremental ? 'incremental program' : 'program'}`,
      )

      const sourceFile = incremental ? builderProgram.getSourceFile(fileName) : program.getSourceFile(fileName)
      if (!hasOwn.call(memoryCache.versions, fileName)) {
        memoryCache.versions[fileName] = 1
      }
      if (memoryCache.contents[fileName] !== code) {
        memoryCache.contents[fileName] = code
        memoryCache.versions[fileName] = (memoryCache.versions[fileName] || 0) + 1
      }
      // Update program when file changes.
      if (sourceFile === undefined || sourceFile.text !== code || program.isSourceFileFromExternalLibrary(sourceFile)) {
        const programOptions = {
          rootNames: Object.keys(memoryCache.versions),
          options,
          host,
          configFileParsingDiagnostics: errors,
          projectReferences,
        }
        if (incremental) {
          builderProgram = ts.createIncrementalProgram(programOptions)
          program = builderProgram.getProgram()
        } else {
          program = ts.createProgram({
            ...programOptions,
            oldProgram: program,
          })
        }
      }
    }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName),
        output: [string, string] = ['', '']

      logger.debug(
        { normalizedFileName },
        `compileFn(): compiling using ${incremental ? 'incremental program' : 'program'}`,
      )
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, normalizedFileName)
      const sourceFile = incremental
        ? builderProgram.getSourceFile(normalizedFileName)
        : program.getSourceFile(normalizedFileName)

      if (!sourceFile) throw new TypeError(`Unable to read file: ${fileName}`)

      const result: _ts.EmitResult = incremental
        ? builderProgram.emit(
            sourceFile,
            (path, file, _writeByteOrderMark) => {
              output[path.endsWith('.map') ? 1 : 0] = file
            },
            undefined,
            undefined,
            customTransformers,
          )
        : program.emit(
            sourceFile,
            (path, file, _writeByteOrderMark) => {
              output[path.endsWith('.map') ? 1 : 0] = file
            },
            undefined,
            undefined,
            customTransformers,
          )

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
    diagnoseFn: (code: string, filePath: string) => {
      const normalizedFileName = normalize(filePath)
      updateMemoryCache(code, normalizedFileName)
      if (configs.shouldReportDiagnostic(normalizedFileName)) {
        logger.debug(
          { normalizedFileName },
          `compileFn(): computing diagnostics for ${incremental ? 'incremental program' : 'program'}`,
        )

        const sourceFile = program.getSourceFile(normalizedFileName),
          diagnostics = program.getSemanticDiagnostics(sourceFile).concat(program.getSyntacticDiagnostics(sourceFile))
        // will raise or just warn diagnostics depending on config
        configs.raiseDiagnostics(diagnostics, normalizedFileName, logger)
      }
    },
    program,
  }
}
