import { Logger } from 'bs-logger'

import { ConfigSet } from '../config/config-set'
import { CompileFn, CompilerInstance, TsCompiler } from '../types'

import { initializeLanguageServiceInstance } from './language-service'
import { initializeTranspilerInstance } from './transpiler'
import { stringify } from '../util/json'

/**
 * Rely on TypeScript compiled output generation which contains this prefix to point to sourcemap location.
 */
const SOURCE_MAPPING_PREFIX = 'sourceMappingURL='

/**
 * Update the output remapping the source map.
 */
function updateOutput(outputText: string, normalizedFileName: string, sourceMap: string): string {
  const base64Map = Buffer.from(updateSourceMap(sourceMap, normalizedFileName), 'utf8').toString('base64')
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`

  // sourceMappingURL= prefix is always at the end of compiledOutput, using lastIndexOf should be the safest way to substring
  return (
    outputText.slice(0, outputText.lastIndexOf(SOURCE_MAPPING_PREFIX) + SOURCE_MAPPING_PREFIX.length) + sourceMapContent
  )
}

/**
 * Update the source map contents for improved output.
 */
const updateSourceMap = (sourceMapText: string, normalizedFileName: string): string => {
  const sourceMap = JSON.parse(sourceMapText)
  sourceMap.file = normalizedFileName
  sourceMap.sources = [normalizedFileName]
  delete sourceMap.sourceRoot

  return stringify(sourceMap)
}

/**
 * Compile files which are provided by jest via transform config and cache the result in file system if users run with
 * cache mode
 */
const compileAndUpdateOutput = (compileFn: CompileFn, logger: Logger) => (
  code: string,
  fileName: string,
  lineOffset?: number,
): string => {
  logger.debug({ fileName }, 'compileAndUpdateOutput(): get compile output')

  const [value, sourceMap] = compileFn(code, fileName, lineOffset)

  return updateOutput(value, fileName, sourceMap)
}

/**
 * Register TypeScript compiler instance.
 *
 * @internal
 */
export const createCompilerInstance = (configs: ConfigSet): TsCompiler => {
  const logger = configs.logger.child({ namespace: 'ts-compiler' })
  const {
    parsedTsConfig: { options: compilerOptions },
    tsJest,
  } = configs
  const extensions = ['.ts', '.tsx']
  // Enable `allowJs` when flag is set.
  if (compilerOptions.allowJs) {
    extensions.push('.js')
    extensions.push('.jsx')
  }
  const compilerInstance: CompilerInstance = !tsJest.isolatedModules
    ? initializeLanguageServiceInstance(configs, logger) // Use language services by default
    : initializeTranspilerInstance(configs, logger)
  const compile = compileAndUpdateOutput(compilerInstance.compileFn, logger)

  return { cwd: configs.cwd, compile, program: compilerInstance.program }
}
