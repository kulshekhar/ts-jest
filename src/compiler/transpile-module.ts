import { Logger } from 'bs-logger'
import { normalize } from 'path'

import { ConfigSet } from '../config/config-set'
import { TypeInfo } from '../types'
import { Errors } from '../util/messages'

import { CompileResult, SourceOutput } from './compiler-types'

/**
 * @internal
 */
export const compileUsingTranspileModule = (configs: ConfigSet, logger: Logger): CompileResult => {
  logger.debug('compileUsingTranspileModule()')

  return {
    getOutput: (code: string, fileName: string): SourceOutput => {
      logger.debug({ fileName }, 'getOutput(): compiling as isolated module')

      const normalizedFileName = normalize(fileName)
      const result = configs.compilerModule.transpileModule(code, {
        fileName: normalizedFileName,
        // @ts-ignore
        transformers: configs.tsCustomTransformers,
        compilerOptions: configs.typescript.options,
        reportDiagnostics: configs.shouldReportDiagnostic(normalizedFileName),
      })

      if (result.diagnostics && configs.shouldReportDiagnostic(normalizedFileName)) {
        configs.raiseDiagnostics(result.diagnostics, normalizedFileName, logger)
      }

      return [result.outputText, result.sourceMapText!]
    },
    getTypeInfo: (_code: string, _fileName: string, _position: number): TypeInfo => {
      throw new TypeError(Errors.TypesUnavailableWithoutTypeCheck)
    },
  }
}
