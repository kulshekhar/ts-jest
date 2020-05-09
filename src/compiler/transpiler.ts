import { Logger } from 'bs-logger'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'

/**
 * @internal
 */
export const initializeTranspilerInstance = (
  configs: ConfigSet,
  memoryCache: MemoryCache,
  logger: Logger,
): CompilerInstance => {
  logger.debug('initializeTranspilerInstance(): create typescript compiler')

  const { options, fileNames } = configs.parsedTsConfig
  const ts = configs.compilerModule
  const program = ts.createProgram(fileNames, options)
  /* istanbul ignore next (we leave this for e2e) */
  const updateFileInCache = (contents: string, filePath: string) => {
    const file = memoryCache.files.get(filePath)
    if (file && file.text !== contents) {
      file.version++
      file.text = contents
    }
  }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      updateFileInCache(code, fileName)

      logger.debug({ fileName }, 'compileFn(): compiling as isolated module')

      const result: _ts.TranspileOutput = ts.transpileModule(code, {
        fileName,
        transformers: configs.tsCustomTransformers,
        compilerOptions: options,
        reportDiagnostics: configs.shouldReportDiagnostic(fileName),
      })
      if (result.diagnostics && configs.shouldReportDiagnostic(fileName)) {
        configs.raiseDiagnostics(result.diagnostics, fileName, logger)
      }

      return [result.outputText, result.sourceMapText!]
    },
    program,
  }
}
