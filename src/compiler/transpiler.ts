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
        transformers: configs.tsCustomTransformers,
        compilerOptions: options,
        reportDiagnostics: configs.shouldReportDiagnostic(fileName),
      })
      if (result.diagnostics && configs.shouldReportDiagnostic(fileName)) {
        configs.raiseDiagnostics(result.diagnostics, fileName, logger)
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [result.outputText, result.sourceMapText!]
    },
    program: undefined,
  }
}
