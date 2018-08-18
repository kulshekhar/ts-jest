/**
 * This code is heavilly inspired from
 * https://github.com/JsCommunity/make-error/blob/v1.3.4/index.js
 * Below is the original license:
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

import { relative, basename, extname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { EOL } from 'os'
import mkdirp = require('mkdirp')
import bufferFrom from 'buffer-from'
import stableStringify = require('fast-json-stable-stringify')
import _ts, { CustomTransformers } from 'typescript'
import { wrapWithDebug, debug } from './debug'
import { ConfigSet } from './config-set'
import { sha1 } from './sha1'
import { TsCompiler, MemoryCache, TypeInfo } from './types'
import { Errors, interpolate } from './messages'
import { factory as customTransformersFactory } from './transformers'

/**
 * Register TypeScript compiler.
 */
export function createCompiler(configs: ConfigSet): TsCompiler {
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

  // TODO: grab internal transformers
  const transformers: CustomTransformers = customTransformersFactory(configs)

  /**
   * Create the basic required function using transpile mode.
   */
  let getOutput = (
    code: string,
    fileName: string,
    lineOffset = 0,
  ): SourceOutput => {
    const result = ts.transpileModule(code, {
      fileName,
      transformers,
      compilerOptions,
      reportDiagnostics: configs.shouldReportDiagnostic(fileName),
    })

    const diagnosticList = result.diagnostics
      ? configs.filterDiagnostics(result.diagnostics)
      : []

    if (diagnosticList.length) throw configs.createTsError(diagnosticList)

    return [result.outputText, result.sourceMapText as string]
  }

  let getTypeInfo = (
    _code: string,
    _fileName: string,
    _position: number,
  ): TypeInfo => {
    throw new TypeError(Errors.TypesUnavailableWithoutTypeCheck)
  }

  // Use full language services when the fast option is disabled.
  if (configs.tsJest.typeCheck) {
    // Set the file contents into cache.
    const updateMemoryCache = (code: string, fileName: string) => {
      if (memoryCache.contents[fileName] !== code) {
        memoryCache.contents[fileName] = code
        memoryCache.versions[fileName] =
          (memoryCache.versions[fileName] || 0) + 1
      }
    }

    // Create the compiler host for type checking.
    const serviceHost = {
      getScriptFileNames: () => Object.keys(memoryCache.versions),
      getScriptVersion: (fileName: string) => {
        const version = memoryCache.versions[fileName]

        // We need to return `undefined` and not a string here because TypeScript will use
        // `getScriptVersion` and compare against their own version - which can be `undefined`.
        // If we don't return `undefined` it results in `undefined === "undefined"` and run
        // `createProgram` again (which is very slow). Using a `string` assertion here to avoid
        // TypeScript errors from the function signature (expects `(x: string) => string`).
        return version === undefined
          ? ((undefined as any) as string)
          : String(version)
      },
      getScriptSnapshot(fileName: string) {
        // Read contents into TypeScript memory cache.
        if (
          !Object.prototype.hasOwnProperty.call(memoryCache.contents, fileName)
        ) {
          memoryCache.contents[fileName] = ts.sys.readFile(fileName)
        }

        const contents = memoryCache.contents[fileName]
        if (contents === undefined) {
          return
        }
        return ts.ScriptSnapshot.fromString(contents)
      },
      fileExists: wrapWithDebug('fileExists', ts.sys.fileExists),
      readFile: wrapWithDebug('readFile', ts.sys.readFile),
      readDirectory: wrapWithDebug('readDirectory', ts.sys.readDirectory),
      getDirectories: wrapWithDebug('getDirectories', ts.sys.getDirectories),
      directoryExists: wrapWithDebug('directoryExists', ts.sys.directoryExists),
      getNewLine: () => EOL,
      getCurrentDirectory: () => cwd,
      getCompilationSettings: () => compilerOptions,
      getDefaultLibFileName: () => ts.getDefaultLibFilePath(compilerOptions),
      getCustomTransformers: () => transformers,
    }

    const service = ts.createLanguageService(serviceHost)

    getOutput = (code: string, fileName: string, lineOffset: number = 0) => {
      // Must set memory cache before attempting to read file.
      updateMemoryCache(code, fileName)

      const output = service.getEmitOutput(fileName)

      // Get the relevant diagnostics - this is 3x faster than `getPreEmitDiagnostics`.
      const diagnostics = service
        .getCompilerOptionsDiagnostics()
        .concat(service.getSyntacticDiagnostics(fileName))
        .concat(service.getSemanticDiagnostics(fileName))

      const diagnosticList = configs.filterDiagnostics(diagnostics)

      if (diagnosticList.length) {
        throw configs.createTsError(diagnosticList)
      }

      if (output.emitSkipped) {
        throw new TypeError(`${relative(cwd, fileName)}: Emit skipped`)
      }

      // Throw an error when requiring `.d.ts` files.
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

  const compile = readThrough(cachedir, memoryCache, getOutput, getExtension)
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
  compile: (
    code: string,
    fileName: string,
    lineOffset?: number,
  ) => SourceOutput,
  getExtension: (fileName: string) => string,
) {
  if (!cachedir) {
    return (code: string, fileName: string, lineOffset?: number) => {
      debug('readThrough', fileName)

      const [value, sourceMap] = compile(code, fileName, lineOffset)
      const output = updateOutput(value, fileName, sourceMap, getExtension)

      memoryCache.outputs[fileName] = output

      return output
    }
  }

  // Make sure the cache directory exists before continuing.
  mkdirp.sync(cachedir)

  return (code: string, fileName: string, lineOffset?: number) => {
    debug('readThrough', fileName)

    const cachePath = join(cachedir, getCacheName(code, fileName))
    const extension = getExtension(fileName)
    const outputPath = `${cachePath}${extension}`

    try {
      const output = readFileSync(outputPath, 'utf8')
      if (isValidCacheContent(output)) {
        memoryCache.outputs[fileName] = output
        return output
      }
    } catch (err) {
      /* Ignore. */
    }

    const [value, sourceMap] = compile(code, fileName, lineOffset)
    const output = updateOutput(value, fileName, sourceMap, getExtension)

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
) {
  const base64Map = bufferFrom(
    updateSourceMap(sourceMap, fileName),
    'utf8',
  ).toString('base64')
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`
  const sourceMapLength =
    `${basename(fileName)}.map`.length +
    (getExtension(fileName).length - extname(fileName).length)

  return outputText.slice(0, -sourceMapLength) + sourceMapContent
}

/**
 * Update the source map contents for improved output.
 */
function updateSourceMap(sourceMapText: string, fileName: string) {
  const sourceMap = JSON.parse(sourceMapText)
  sourceMap.file = fileName
  sourceMap.sources = [fileName]
  delete sourceMap.sourceRoot
  return stableStringify(sourceMap)
}

/**
 * Get the file name for the cache entry.
 */
function getCacheName(sourceCode: string, fileName: string) {
  return sha1(extname(fileName), '\x00', sourceCode)
}

/**
 * Ensure the given cached content is valid by sniffing for a base64 encoded '}'
 * at the end of the content, which should exist if there is a valid sourceMap present.
 */
function isValidCacheContent(contents: string) {
  return /(?:9|0=|Q==)$/.test(contents.slice(-3))
}
