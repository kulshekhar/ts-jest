import { Logger } from 'bs-logger'
import { normalize } from 'path'

import { ConfigSet } from '../config/config-set'
import { CompileResult, SourceOutput } from '../types'

/**
 * @internal
 */
export const compileUsingTranspileModule = (configs: ConfigSet, logger: Logger): CompileResult => {
  logger.debug('compileUsingTranspileModule(): create typescript compiler')

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      logger.debug({ fileName }, 'getOutput(): compiling as isolated module')

      const normalizedFileName = normalize(fileName)
      const result = configs.compilerModule.transpileModule(code, {
        fileName: normalizedFileName,
        transformers: configs.tsCustomTransformers,
        compilerOptions: configs.typescript.options,
        reportDiagnostics: configs.shouldReportDiagnostic(normalizedFileName),
      })

      if (result.diagnostics && configs.shouldReportDiagnostic(normalizedFileName)) {
        configs.raiseDiagnostics(result.diagnostics, normalizedFileName, logger)
      }

      return [result.outputText, result.sourceMapText!]
    },
  }
}
