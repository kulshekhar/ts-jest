import { Logger } from 'bs-logger'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompilerInstance, MemoryCache, SourceOutput } from '../types'

import { getAndCacheProjectReference, getCompileResultFromReferencedProject } from './compiler-utils'

/**
 * @internal
 */
export const initializeTranspilerInstance = (
  configs: ConfigSet,
  memoryCache: MemoryCache,
  logger: Logger,
): CompilerInstance => {
  logger.debug('initializeTranspilerInstance(): create typescript compiler')

  const { options, projectReferences, fileNames } = configs.typescript
  const ts = configs.compilerModule
  const program = projectReferences
    ? ts.createProgram({
        rootNames: fileNames,
        options,
        projectReferences,
      })
    : ts.createProgram([], options)
  /* istanbul ignore next (we leave this for e2e) */
  const updateFileInCache = (contents: string, filePath: string) => {
    const file = memoryCache.files[filePath]
    if (file && file.text !== contents) {
      file.version++
      file.text = contents
    }
  }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      updateFileInCache(code, fileName)
      const referencedProject = getAndCacheProjectReference(fileName, program, memoryCache.files, projectReferences)
      /* istanbul ignore next (referencedProject object is too complex to mock so we leave this for e2e) */
      if (referencedProject !== undefined) {
        logger.debug({ fileName }, 'compileFn(): get compile result from referenced project')

        return getCompileResultFromReferencedProject(fileName, configs, memoryCache.files, referencedProject)
      } else {
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
      }
    },
    program,
  }
}
