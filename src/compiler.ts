/**
 * This code is heavilly inspired from
 * https://github.com/JsCommunity/make-error/blob/v1.3.4/index.js
 * ...but more modified than expected :-D
 * Below is the original license anyway:
 *
 * ---
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { LogContexts, LogLevels, Logger } from 'bs-logger'
import bufferFrom = require('buffer-from')
import stableStringify = require('fast-json-stable-stringify')
import { readFileSync, writeFileSync } from 'fs'
import memoize = require('lodash.memoize')
import mkdirp = require('mkdirp')
import { basename, extname, join, normalize, relative } from 'path'

import { ConfigSet } from './config/config-set'
import { MemoryCache, TsCompiler, TypeInfo } from './types'
import { Errors, interpolate } from './util/messages'
import { sha1 } from './util/sha1'

const hasOwn = Object.prototype.hasOwnProperty

/**
 * Register TypeScript compiler.
 * @internal
 */
export function createCompiler(configs: ConfigSet): TsCompiler {
  const logger = configs.logger.child({ namespace: 'ts-compiler' })
  logger.debug(
    'creating typescript compiler',
    configs.tsJest.isolatedModules ? '(isolated modules)' : '(language service)',
  )
  const cachedir = configs.tsCacheDir

  const memoryCache: MemoryCache = {
    contents: Object.create(null),
    versions: Object.create(null),
    outputs: Object.create(null),
  }

  // Require the TypeScript compiler and configuration.
  const ts = configs.compilerModule
  const cwd = configs.cwd

  const extensions = ['.ts', '.tsx']
  const {
    typescript: { options: compilerOptions, fileNames },
  } = configs

  // Enable `allowJs` when flag is set.
  if (compilerOptions.allowJs) {
    extensions.push('.js')
    extensions.push('.jsx')
  }

  // Initialize files from TypeScript into project.
  for (const path of fileNames) memoryCache.versions[path] = 1

  /**
   * Get the extension for a transpiled file.
   */
  const getExtension =
    compilerOptions.jsx === ts.JsxEmit.Preserve
      ? (path: string) => (/\.[tj]sx$/.test(path) ? '.jsx' : '.js')
      : (_: string) => '.js'

  const transformers = configs.tsCustomTransformers

  /**
   * Create the basic required function using transpile mode.
   */
  let getOutput = (code: string, fileName: string /* , lineOffset = 0 */): SourceOutput => {
    logger.debug({ fileName }, 'getOutput(): compiling as isolated module')
    const result = ts.transpileModule(code, {
      fileName,
      transformers,
      compilerOptions,
      reportDiagnostics: configs.shouldReportDiagnostic(fileName),
    })

    if (result.diagnostics) configs.raiseDiagnostics(result.diagnostics, fileName, logger)

    return [result.outputText, result.sourceMapText as string]
  }

  let getTypeInfo = (_code: string, _fileName: string, _position: number): TypeInfo => {
    throw new TypeError(Errors.TypesUnavailableWithoutTypeCheck)
  }

  // Use full language services when the fast option is disabled.
  if (!configs.tsJest.isolatedModules) {
    // Set the file contents into cache.
    const updateMemoryCache = (code: string, fileName: string) => {
      logger.debug({ fileName }, `updateMemoryCache()`)
      if (memoryCache.contents[fileName] !== code) {
        memoryCache.contents[fileName] = code
        memoryCache.versions[fileName] = (memoryCache.versions[fileName] || 0) + 1
      }
    }

    // Create the compiler host for type checking.
    const serviceHostDebugCtx = {
      [LogContexts.logLevel]: LogLevels.debug,
      namespace: 'ts:serviceHost',
      call: null,
    }
    const serviceHostTraceCtx = {
      ...serviceHostDebugCtx,
      [LogContexts.logLevel]: LogLevels.trace,
    }

    const serviceHost = {
      getScriptFileNames: () => Object.keys(memoryCache.versions),
      getScriptVersion: (fileName: string) => {
        const normalizedFileName = normalize(fileName)
        const version = memoryCache.versions[normalizedFileName]

        // We need to return `undefined` and not a string here because TypeScript will use
        // `getScriptVersion` and compare against their own version - which can be `undefined`.
        // If we don't return `undefined` it results in `undefined === "undefined"` and run
        // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
        // TypeScript errors from the function signature (expects `(x: string) => string`).
        return version === undefined ? ((undefined as any) as string) : String(version)
      },
      getScriptSnapshot(fileName: string) {
        const normalizedFileName = normalize(fileName)
        const hit = hasOwn.call(memoryCache.contents, normalizedFileName)
        logger.trace({ normalizedFileName, cacheHit: hit }, `getScriptSnapshot():`, 'cache', hit ? 'hit' : 'miss')
        // Read contents from TypeScript memory cache.
        if (!hit) {
          memoryCache.contents[normalizedFileName] = ts.sys.readFile(normalizedFileName)
        }

        const contents = memoryCache.contents[normalizedFileName]
        if (contents === undefined) {
          return
        }
        return ts.ScriptSnapshot.fromString(contents)
      },
      fileExists: memoize(ts.sys.fileExists),
      readFile: logger.wrap(serviceHostTraceCtx, 'readFile', memoize(ts.sys.readFile)),
      readDirectory: memoize(ts.sys.readDirectory),
      getDirectories: memoize(ts.sys.getDirectories),
      directoryExists: memoize(ts.sys.directoryExists),
      realpath: memoize(ts.sys.realpath!),
      getNewLine: () => '\n',
      getCurrentDirectory: () => cwd,
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: () => ts.getDefaultLibFilePath(compilerOptions),
      getCustomTransformers: () => transformers,
    }

    logger.debug('creating language service')
    const service = ts.createLanguageService(serviceHost)

    getOutput = (code: string, fileName: string /*, lineOffset = 0 */) => {
      logger.debug({ fileName }, 'getOutput(): compiling using language service')
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, fileName)

      const output = service.getEmitOutput(fileName)

      if (configs.shouldReportDiagnostic(fileName)) {
        logger.debug({ fileName }, 'getOutput(): computing diagnostics')
        // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
        const diagnostics = service
          .getCompilerOptionsDiagnostics()
          .concat(service.getSyntacticDiagnostics(fileName))
          .concat(service.getSemanticDiagnostics(fileName))

        // will raise or just warn diagnostics depending on config
        configs.raiseDiagnostics(diagnostics, fileName, logger)
      }

      /* istanbul ignore next (this should never happen but is kept for security) */
      if (output.emitSkipped) {
        throw new TypeError(`${relative(cwd, fileName)}: Emit skipped`)
      }

      // Throw an error when requiring `.d.ts` files.
      /* istanbul ignore next (this should never happen but is kept for security) */
      if (output.outputFiles.length === 0) {
        throw new TypeError(
          interpolate(Errors.UnableToRequireDefinitionFile, {
            file: basename(fileName),
          }),
        )
      }

      return [output.outputFiles[1].text, output.outputFiles[0].text]
    }

    getTypeInfo = (code: string, fileName: string, position: number) => {
      updateMemoryCache(code, fileName)

      const info = service.getQuickInfoAtPosition(fileName, position)
      const name = ts.displayPartsToString(info ? info.displayParts : [])
      const comment = ts.displayPartsToString(info ? info.documentation : [])

      return { name, comment }
    }
  }

  const compile = readThrough(cachedir, memoryCache, getOutput, getExtension, cwd, logger)
  return { cwd, compile, getTypeInfo, extensions, cachedir, ts }
}

/**
 * Internal source output.
 */
type SourceOutput = [string, string]

/**
 * Wrap the function with caching.
 */
function readThrough(
  cachedir: string | undefined,
  memoryCache: MemoryCache,
  compile: (code: string, fileName: string, lineOffset?: number) => SourceOutput,
  getExtension: (fileName: string) => string,
  cwd: string,
  logger: Logger,
) {
  if (!cachedir) {
    return (code: string, fileName: string, lineOffset?: number) => {
      logger.debug({ fileName }, 'readThrough(): no cache')

      const [value, sourceMap] = compile(code, fileName, lineOffset)
      const output = updateOutput(value, fileName, sourceMap, getExtension, cwd)

      memoryCache.outputs[fileName] = output

      return output
    }
  }

  // Make sure the cache directory exists before continuing.
  mkdirp.sync(cachedir)

  return (code: string, fileName: string, lineOffset?: number) => {
    const cachePath = join(cachedir, getCacheName(code, fileName))
    const extension = getExtension(fileName)
    const outputPath = `${cachePath}${extension}`

    try {
      const output = readFileSync(outputPath, 'utf8')
      if (isValidCacheContent(output)) {
        logger.debug({ fileName }, 'readThrough(): cache hit')
        memoryCache.outputs[fileName] = output
        return output
      }
    } catch (err) {}

    logger.debug({ fileName }, 'readThrough(): cache miss')
    const [value, sourceMap] = compile(code, fileName, lineOffset)
    const output = updateOutput(value, fileName, sourceMap, getExtension, cwd)

    logger.debug({ fileName, outputPath }, 'readThrough(): writing caches')
    memoryCache.outputs[fileName] = output
    writeFileSync(outputPath, output)

    return output
  }
}

/**
 * Update the output remapping the source map.
 */
function updateOutput(
  outputText: string,
  fileName: string,
  sourceMap: string,
  getExtension: (fileName: string) => string,
  sourceRoot: string,
) {
  const base = basename(fileName)
  const base64Map = bufferFrom(updateSourceMap(sourceMap, fileName, sourceRoot), 'utf8').toString('base64')
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`
  const sourceMapLength = `${base}.map`.length + (getExtension(fileName).length - extname(fileName).length)

  return outputText.slice(0, -sourceMapLength) + sourceMapContent
}

/**
 * Update the source map contents for improved output.
 */
function updateSourceMap(sourceMapText: string, fileName: string, _sourceRoot: string) {
  const sourceMap = JSON.parse(sourceMapText)
  // const relativeFilePath = posix.normalize(relative(sourceRoot, fileName))
  // sourceMap.file = relativeFilePath
  // sourceMap.sources = [relativeFilePath]
  // sourceMap.sourceRoot = normalize(sourceRoot)
  sourceMap.file = fileName
  sourceMap.sources = [fileName]
  delete sourceMap.sourceRoot
  return stableStringify(sourceMap)
}

/**
 * Get the file name for the cache entry.
 */
function getCacheName(sourceCode: string, fileName: string) {
  return sha1(fileName, '\x00', sourceCode)
}

/**
 * Ensure the given cached content is valid by sniffing for a base64 encoded '}'
 * at the end of the content, which should exist if there is a valid sourceMap present.
 */
function isValidCacheContent(contents: string) {
  return /(?:9|0=|Q==)$/.test(contents.slice(-3))
}
