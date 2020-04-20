import { Logger } from 'bs-logger'
import { normalize } from 'path'
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
  const updateFileInCache = (contents: string, filePath: string) => {
    const file = memoryCache.files.get(filePath)
    if (file && file.text !== contents) {
      file.version++
      file.text = contents
    }
  }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName)

      updateFileInCache(code, normalizedFileName)
      const referencedProject = getAndCacheProjectReference(
        normalizedFileName,
        program,
        memoryCache.files,
        projectReferences,
      )
      /* istanbul ignore next (referencedProject object is too complex to mock so we leave this for e2e) */
      if (referencedProject !== undefined) {
        logger.debug({ normalizedFileName }, 'compileFn(): get compile result from referenced project')

        return getCompileResultFromReferencedProject(normalizedFileName, configs, memoryCache.files, referencedProject)
      } else {
        logger.debug({ normalizedFileName }, 'compileFn(): compiling as isolated module')

        const result: _ts.TranspileOutput = ts.transpileModule(code, {
          fileName: normalizedFileName,
          transformers: configs.tsCustomTransformers,
          compilerOptions: options,
          reportDiagnostics: configs.shouldReportDiagnostic(normalizedFileName),
        })
        if (result.diagnostics && configs.shouldReportDiagnostic(normalizedFileName)) {
          configs.raiseDiagnostics(result.diagnostics, normalizedFileName, logger)
        }

        return [result.outputText, result.sourceMapText!]
      }
    },
    program,
  }
}
