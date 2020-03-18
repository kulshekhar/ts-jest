import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompileResult, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

/**
 * @internal
 */
export const compileUsingProgram = (configs: ConfigSet, logger: Logger, memoryCache: MemoryCache): CompileResult => {
  logger.debug('compileUsingProgram(): create typescript compiler')

  const ts = configs.compilerModule,
    cwd = configs.cwd,
    { options, fileNames, projectReferences, errors } = configs.typescript,
    incremental = configs.tsJest.incremental
  const compilerHostTraceCtx = {
      namespace: 'ts:compilerHost',
      call: null,
      [LogContexts.logLevel]: LogLevels.trace,
    },
    sys = {
      ...ts.sys,
      readFile: logger.wrap(compilerHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
      readDirectory: logger.wrap(compilerHostTraceCtx, 'readDirectory', memoize(ts.sys.readDirectory)),
      getDirectories: logger.wrap(compilerHostTraceCtx, 'getDirectories', memoize(ts.sys.getDirectories)),
      fileExists: logger.wrap(compilerHostTraceCtx, 'fileExists', memoize(ts.sys.fileExists)),
      directoryExists: logger.wrap(compilerHostTraceCtx, 'directoryExists', memoize(ts.sys.directoryExists)),
      resolvePath: logger.wrap(compilerHostTraceCtx, 'resolvePath', memoize(ts.sys.resolvePath)),
      realpath: ts.sys.realpath ? logger.wrap(compilerHostTraceCtx, 'realpath', memoize(ts.sys.realpath)) : undefined,
      getCurrentDirectory: () => cwd,
      getNewLine: () => '\n',
      getCanonicalFileName: (fileName: string) =>
        ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    }
  let builderProgram: _ts.EmitAndSemanticDiagnosticsBuilderProgram, program: _ts.Program, host: _ts.CompilerHost
  if (incremental) {
    // TODO: Find a way to trigger typescript to build project when there are project references.
    // At the moment this Incremental Program doesn't work with project references
    host = ts.createIncrementalCompilerHost(options, sys)
    builderProgram = ts.createIncrementalProgram({
      rootNames: fileNames.slice(),
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
      rootNames: fileNames.slice(),
      options,
      host,
      configFileParsingDiagnostics: errors,
      projectReferences,
    })
  }
  // Read and cache custom transformers.
  const customTransformers = configs.tsCustomTransformers,
    updateMemoryCache = (contents: string, normalizedFileName: string): void => {
      logger.debug({ normalizedFileName }, `updateMemoryCache() for ${incremental ? 'incremental program' : 'program'}`)

      const fileVersion = memoryCache.versions.get(normalizedFileName) ?? 0,
        isFileInCache = fileVersion !== 0
      // Add to `rootFiles` when discovered for the first time.
      if (!isFileInCache) {
        fileNames.push(normalizedFileName)
      }
      // Avoid incrementing cache when nothing has changed.
      if (memoryCache.contents.get(normalizedFileName) !== contents) {
        memoryCache.versions.set(normalizedFileName, fileVersion + 1)
        memoryCache.contents.set(normalizedFileName, contents)
      }
      const sourceFile = incremental
        ? builderProgram.getSourceFile(normalizedFileName)
        : program.getSourceFile(normalizedFileName)
      // Update program when file changes.
      if (
        sourceFile === undefined ||
        sourceFile.text !== contents ||
        program.isSourceFileFromExternalLibrary(sourceFile)
      ) {
        const programOptions = {
          rootNames: fileNames.slice(),
          options,
          host,
          configFileParsingDiagnostics: errors,
          projectReferences,
        }
        if (incremental) {
          builderProgram = ts.createIncrementalProgram(programOptions)
          program = builderProgram.getProgram()
        } else {
          program = ts.createProgram(programOptions)
        }
      }
    }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName),
        output: [string, string] = ['', '']
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
      if (configs.shouldReportDiagnostic(normalizedFileName)) {
        logger.debug(
          { normalizedFileName },
          `getOutput(): computing diagnostics for ${incremental ? 'incremental program' : 'program'}`,
        )
        const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile).slice()
        // will raise or just warn diagnostics depending on config
        configs.raiseDiagnostics(diagnostics, normalizedFileName, logger)
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
      /* istanbul ignore next */
      if (configs.tsJest.emit && incremental) {
        process.on('exit', () => {
          // Emits `.tsbuildinfo` to filesystem.
          // @ts-ignore
          program.emitBuildInfo()
        })
      }

      return output
    },
    program,
  }
}
