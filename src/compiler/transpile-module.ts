import { Logger } from 'bs-logger'
import { readFileSync } from 'fs'
import { normalize } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { CompilerInstance, SourceOutput, TSFile, TSFiles } from '../types'

import { getAndCacheOutputJSFileName, getAndCacheProjectReference } from './compiler-utils'

/**
 * @internal
 */
export const compileUsingTranspileModule = (configs: ConfigSet, logger: Logger): CompilerInstance => {
  logger.debug('compileUsingTranspileModule(): create typescript compiler')

  const { options, projectReferences, fileNames } = configs.typescript
  const files: TSFiles = new Map<string, TSFile>()
  const compiler = configs.compilerModule
  fileNames.forEach(filePath => {
    const normalizedFilePath = normalize(filePath)
    files.set(normalizedFilePath, {
      text: readFileSync(normalizedFilePath, 'utf-8'),
      version: 0,
    })
  })
  const program = projectReferences
    ? compiler.createProgram({
        rootNames: fileNames,
        options,
        projectReferences,
      })
    : compiler.createProgram([], options)
  const updateFileInCache = (contents: string, filePath: string) => {
    const file = files.get(filePath)
    if (file && file.text !== contents) {
      file.version++
      file.text = contents
    }
  }

  return {
    compileFn: (code: string, fileName: string): SourceOutput => {
      const normalizedFileName = normalize(fileName)

      logger.debug({ normalizedFileName }, 'getOutput(): compiling as isolated module')

      updateFileInCache(code, normalizedFileName)
      const referencedProject = getAndCacheProjectReference(normalizedFileName, program, files, projectReferences)
      /* istanbul ignore next (referencedProject object is too complex to mock so we leave this for e2e) */
      if (referencedProject !== undefined) {
        const [relativeProjectConfigPath, relativeFilePath] = [
          configs.resolvePath(referencedProject.sourceFile.fileName),
          configs.resolvePath(normalizedFileName),
        ]
        if (referencedProject.commandLine.options.outFile !== undefined) {
          throw new Error(
            `The referenced project at ${relativeProjectConfigPath} is using ` +
              `the outFile' option, which is not supported with ts-jest.`,
          )
        }

        const jsFileName = getAndCacheOutputJSFileName(normalizedFileName, referencedProject, files)
        const relativeJSFileName = configs.resolvePath(jsFileName)
        if (!compiler.sys.fileExists(jsFileName)) {
          throw new Error(
            // tslint:disable-next-line:prefer-template
            `Could not find output JavaScript file for input ` +
              `${relativeFilePath} (looked at ${relativeJSFileName}).\n` +
              `The input file is part of a project reference located at ` +
              `${relativeProjectConfigPath}, so ts-jest is looking for the ` +
              'project’s pre-built output on disk. Try running `tsc --build` ' +
              'to build project references.',
          )
        }

        const mapFileName = `${jsFileName}.map`
        const outputText = compiler.sys.readFile(jsFileName)
        const sourceMapText = compiler.sys.readFile(mapFileName)

        return [outputText!, sourceMapText!]
      } else {
        const result: _ts.TranspileOutput = compiler.transpileModule(code, {
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
