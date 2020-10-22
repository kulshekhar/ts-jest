import type { Logger } from 'bs-logger'
import type * as _ts from 'typescript'

import type { ConfigSet } from '../config/config-set'
import type { CompilerInstance, SourceOutput } from '../types'

/**
 * @internal
 */
export const initializeTranspilerInstance = (configs: ConfigSet, logger: Logger): CompilerInstance => {
  logger.debug('initializeTranspilerInstance(): create typescript compiler')

  const { options } = configs.parsedTsConfig
  const ts = configs.compilerModule

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      logger.debug({ fileName }, 'compileFn(): compiling as isolated module')

      const result: _ts.TranspileOutput = ts.transpileModule(code, {
        fileName,
        transformers: configs.customTransformers,
        compilerOptions: options,
        reportDiagnostics: configs.shouldReportDiagnostics(fileName),
      })
      if (result.diagnostics && configs.shouldReportDiagnostics(fileName)) {
        configs.raiseDiagnostics(result.diagnostics, fileName, logger)
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [result.outputText, result.sourceMapText!]
    },
    program: undefined,
  }
}
