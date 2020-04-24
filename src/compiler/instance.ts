import { Logger } from 'bs-logger'
import { readFileSync } from 'fs'
import mkdirp = require('mkdirp')
import { basename, extname } from 'path'

import { ConfigSet } from '../config/config-set'
import { CompileFn, CompilerInstance, MemoryCache, TsCompiler } from '../types'

import { getResolvedModulesCache } from './compiler-utils'
import { initializeLanguageServiceInstance } from './language-service'
import { initializeTranspilerInstance } from './transpiler'

/**
 * Update the output remapping the source map.
 */
function updateOutput(
  outputText: string,
  normalizedFileName: string,
  sourceMap: string,
  getExtension: (fileName: string) => string,
) {
  const base = basename(normalizedFileName)
  const base64Map = Buffer.from(updateSourceMap(sourceMap, normalizedFileName), 'utf8').toString('base64')
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`
  const sourceMapLength =
    `${base}.map`.length + (getExtension(normalizedFileName).length - extname(normalizedFileName).length)

  return outputText.slice(0, -sourceMapLength) + sourceMapContent
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
const compileAndCacheResult = (
  memoryCache: MemoryCache,
  compileFn: CompileFn,
  getExtension: (fileName: string) => string,
  logger: Logger,
) => {
  return (code: string, fileName: string, lineOffset?: number) => {
    logger.debug({ fileName }, 'compileAndCacheResult(): get compile output')

    const [value, sourceMap] = compileFn(code, fileName, lineOffset)
    const output = updateOutput(value, fileName, sourceMap, getExtension)
    memoryCache.files[fileName] = {
      ...memoryCache.files[fileName],
      output,
    }

    return output
  }
}

/**
 * Register TypeScript compiler instance.
 * @internal
 */
export const createCompilerInstance = (configs: ConfigSet): TsCompiler => {
  const logger = configs.logger.child({ namespace: 'ts-compiler' })
  const {
    typescript: { options: compilerOptions },
    tsJest,
  } = configs
  const cacheDir = configs.tsCacheDir
  const ts = configs.compilerModule // Require the TypeScript compiler and configuration.
  const extensions = ['.ts', '.tsx']
  const memoryCache: MemoryCache = {
    files: Object.create(null),
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
  /* istanbul ignore next (we leave this for e2e) */
  configs.jest.setupFiles.concat(configs.jest.setupFilesAfterEnv).forEach(setupFile => {
    memoryCache.files[setupFile] = {
      version: 0,
    }
  })
  /**
   * Get the extension for a transpiled file.
   */
  const getExtension =
    compilerOptions.jsx === ts.JsxEmit.Preserve
      ? (path: string) => (/\.[tj]sx$/.test(path) ? '.jsx' : '.js')
      : (_: string) => '.js'
  let compilerInstance: CompilerInstance
  if (!tsJest.isolatedModules) {
    // Use language services by default
    compilerInstance = initializeLanguageServiceInstance(configs, memoryCache, logger)
  } else {
    compilerInstance = initializeTranspilerInstance(configs, memoryCache, logger)
  }
  const compile = compileAndCacheResult(memoryCache, compilerInstance.compileFn, getExtension, logger)

  return { cwd: configs.cwd, compile, program: compilerInstance.program }
}
