import { LogContexts, LogLevels, Logger } from 'bs-logger'
import memoize = require('lodash.memoize')
import micromatch = require('micromatch')
import { basename, normalize, relative } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'
import { Errors, interpolate } from '../util/messages'

import { cacheResolvedModules, hasOwn } from './compiler-utils'

function doTypeChecking(configs: ConfigSet, fileName: string, program: _ts.Program, logger: Logger) {
  if (configs.shouldReportDiagnostic(fileName)) {
    const sourceFile = program.getSourceFile(fileName),
      diagnostics = program.getSemanticDiagnostics(sourceFile).concat(program.getSyntacticDiagnostics(sourceFile))
    // will raise or just warn diagnostics depending on config
    configs.raiseDiagnostics(diagnostics, fileName, logger)
  }
}

/**
 * @internal
 */
export const compileUsingProgram = (configs: ConfigSet, logger: Logger, memoryCache: MemoryCache): CompilerInstance => {
  logger.debug('compileUsingProgram(): create typescript compiler')

  const ts = configs.compilerModule,
    cwd = configs.cwd,
    { options, projectReferences, errors } = configs.typescript,
    incremental = configs.tsJest.incremental,
    programDebugText = `${incremental ? 'incremental program' : 'program'}`
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
      logger.debug({ fileName }, `updateMemoryCache(): update memory cache for ${programDebugText}`)

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
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, normalizedFileName)
      const sourceFile = incremental
        ? builderProgram.getSourceFile(normalizedFileName)
        : program.getSourceFile(normalizedFileName)

      if (!sourceFile) throw new TypeError(`Unable to read file: ${fileName}`)

      logger.debug({ normalizedFileName }, `compileFn(): compiling using ${programDebugText}`)

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
      // Do type checking by getting TypeScript diagnostics
      logger.debug(`diagnoseFn(): computing diagnostics for ${normalizedFileName} using ${programDebugText}`)

      doTypeChecking(configs, normalizedFileName, program, logger)
      /* istanbul ignore next (covered by e2e) */
      if (micromatch.isMatch(normalizedFileName, configs.testMatchPatterns)) {
        cacheResolvedModules(normalizedFileName, memoryCache, program, configs.tsCacheDir, logger)
      } else {
        /* istanbul ignore next (covered by e2e) */
        Object.entries(memoryCache.resolvedModules)
          .filter(entry => {
            /**
             * When imported modules change, we only need to check whether the test file is compiled previously or not.
             * Due to jest cache, our memory cache won't contain compiled result of test file so we are sure that we
             * can do type checking on test file. By checking memory cache, we can avoid repeatedly doing type checking
             * against test file for 1st time run after clearing cache.
             */
            return (
              entry[1].find(modulePath => modulePath === normalizedFileName) &&
              !hasOwn.call(memoryCache.outputs, entry[0])
            )
          })
          .forEach(entry => {
            logger.debug(
              `diagnoseFn(): computing diagnostics for test file that imports ${normalizedFileName} using ${programDebugText}`,
            )

            doTypeChecking(configs, entry[0], program, logger)
          })
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
