import { Logger } from 'bs-logger'
import { readFileSync } from 'fs'
import mkdirp = require('mkdirp')

import { ConfigSet } from '../config/config-set'
import { CompileFn, CompilerInstance, MemoryCache, TSFile, TsCompiler } from '../types'

import { getResolvedModulesCache } from './compiler-utils'
import { initializeLanguageServiceInstance } from './language-service'
import { initializeTranspilerInstance } from './transpiler'

/**
 * Rely on TypeScript compiled output generation which contains this prefix to point to sourcemap location.
 */
const SOURCE_MAPPING_PREFIX = 'sourceMappingURL='

/**
 * Update the output remapping the source map.
 */
function updateOutput(outputText: string, normalizedFileName: string, sourceMap: string) {
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

  return JSON.stringify(sourceMap)
}

/**
 * Compile files which are provided by jest via transform config and cache the result in file system if users run with
 * cache mode
 */
const compileAndCacheResult = (memoryCache: MemoryCache, compileFn: CompileFn, logger: Logger) => (
  code: string,
  fileName: string,
  lineOffset?: number,
) => {
  logger.debug({ fileName }, 'compileAndCacheResult(): get compile output')

  const [value, sourceMap] = compileFn(code, fileName, lineOffset)
  const output = updateOutput(value, fileName, sourceMap)
  memoryCache.files.set(fileName, {
    ...memoryCache.files.get(fileName)!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
    output,
  })

  return output
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
  const cacheDir = configs.tsCacheDir
  const extensions = ['.ts', '.tsx']
  const memoryCache: MemoryCache = {
    files: new Map<string, TSFile>(),
    resolvedModules: Object.create(null),
  }
  // Enable `allowJs` when flag is set.
  if (compilerOptions.allowJs) {
    extensions.push('.js')
    extensions.push('.jsx')
  }
  if (cacheDir) {
    // Make sure the cache directory exists before continuing.
    mkdirp.sync(cacheDir)
    try {
      const fsMemoryCache = readFileSync(getResolvedModulesCache(cacheDir), 'utf-8')
      /* istanbul ignore next (covered by e2e) */
      memoryCache.resolvedModules = JSON.parse(fsMemoryCache)
    } catch (e) {}
  }
  // Initialize memory cache for typescript compiler
  configs.parsedTsConfig.fileNames.forEach((fileName) => {
    memoryCache.files.set(fileName, {
      version: 0,
    })
  })
  let compilerInstance: CompilerInstance
  if (!tsJest.isolatedModules) {
    // Use language services by default
    compilerInstance = initializeLanguageServiceInstance(configs, memoryCache, logger)
  } else {
    compilerInstance = initializeTranspilerInstance(configs, memoryCache, logger)
  }
  const compile = compileAndCacheResult(memoryCache, compilerInstance.compileFn, logger)

  return { cwd: configs.cwd, compile, program: compilerInstance.program }
}
