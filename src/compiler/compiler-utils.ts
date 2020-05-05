import { Logger } from 'bs-logger'
import { writeFileSync } from 'fs'
import micromatch = require('micromatch')
import { dirname, join, normalize, relative, resolve } from 'path'
import * as _ts from 'typescript'

import { ConfigSet } from '../config/config-set'
import { EXTENSION_REGEX, JSON_REGEX, TS_TSX_REGEX } from '../constants'
import { MemoryCache, SourceOutput, TSFiles } from '../types'
import { sha1 } from '../util/sha1'

/**
 * @internal
 */
export function getResolvedModulesCache(cacheDir: string): string {
  return join(cacheDir, sha1('ts-jest-resolved-modules', '\x00'))
}

/**
 * @internal
 * Get resolved modules of a test file and put into memory cache
 */
/* istanbul ignore next (we leave this for e2e) */
export function cacheResolvedModules(
  fileName: string,
  fileContent: string,
  memoryCache: MemoryCache,
  program: _ts.Program,
  cacheDir: string,
  logger: Logger,
) {
  // @ts-ignore
  const importReferences = program.getSourceFile(fileName)!.imports
  /**
   * Ugly trick while waiting for https://github.com/microsoft/TypeScript/issues/33994
   */
  if (importReferences.length) {
    logger.debug({ fileName }, 'cacheResolvedModules(): get resolved modules')

    memoryCache.resolvedModules[fileName] = Object.create(null)
    memoryCache.resolvedModules[fileName].modulePaths = importReferences
      .filter((importReference: any) => importReference.parent.parent.resolvedModules?.get(importReference.text))
      .map((importReference: any) =>
        normalize(
          (importReference.parent.parent.resolvedModules.get(importReference.text) as _ts.ResolvedModule)
            .resolvedFileName,
        ),
      )
      .reduce((a: any, b: any) => a.concat(b), [])
    memoryCache.resolvedModules[fileName].testFileContent = fileContent
    writeFileSync(getResolvedModulesCache(cacheDir), JSON.stringify(memoryCache.resolvedModules))
  }
}

/**
 * @internal
 */
export function isTestFile(testMatchPatterns: (string | RegExp)[], fileName: string) {
  return testMatchPatterns.some(pattern =>
    typeof pattern === 'string' ? micromatch.isMatch(fileName, pattern) : pattern.test(fileName),
  )
}

/* istanbul ignore next (we leave this for e2e) */
function isUsingProjectReferences(
  program: _ts.Program,
  projectReferences: readonly _ts.ProjectReference[] | undefined,
) {
  if (projectReferences && !!program.getProjectReferences) {
    return Boolean(program && program.getProjectReferences())
  }

  return false
}

/* istanbul ignore next (we leave this for e2e) */
function getResolvedProjectReferences(
  program: _ts.Program,
): readonly (_ts.ResolvedProjectReference | undefined)[] | undefined {
  const getProjectReferences = program.getResolvedProjectReferences ?? program.getProjectReferences
  if (getProjectReferences) {
    return getProjectReferences()
  }

  return
}

/* istanbul ignore next (we leave this for e2e) */
function getProjectReferenceForFile(
  filePath: string,
  program: _ts.Program,
  projectReferences: readonly _ts.ProjectReference[] | undefined,
) {
  if (isUsingProjectReferences(program, projectReferences)) {
    return (
      program &&
      getResolvedProjectReferences(program)!.find(
        ref => (ref && ref.commandLine.fileNames.some(file => normalize(file) === filePath)) || false,
      )
    )
  }

  return
}

/**
 * @internal
 */
/* istanbul ignore next (we leave this for e2e) */
export function getAndCacheProjectReference(
  filePath: string,
  program: _ts.Program,
  files: TSFiles,
  projectReferences: readonly _ts.ProjectReference[] | undefined,
) {
  const file = files.get(filePath)
  if (file?.projectReference) {
    return file.projectReference.project
  }

  const projectReference = getProjectReferenceForFile(filePath, program, projectReferences)
  if (file !== undefined) {
    file.projectReference = { project: projectReference }
  }

  return projectReference
}

// Adapted from https://github.com/Microsoft/TypeScript/blob/45101491c0b077c509b25830ef0ee5f85b293754/src/compiler/tsbuild.ts#L305
/* istanbul ignore next (we leave this for e2e) */
function getOutputJavaScriptFileName(inputFileName: string, projectReference: _ts.ResolvedProjectReference) {
  const { options } = projectReference.commandLine
  const projectDirectory = options.rootDir || dirname(projectReference.sourceFile.fileName)
  const relativePath = relative(projectDirectory, inputFileName)
  const outputPath = resolve(options.outDir || projectDirectory, relativePath)
  const newExtension = JSON_REGEX.test(inputFileName)
    ? '.json'
    : TS_TSX_REGEX.test(inputFileName) && options.jsx === _ts.JsxEmit.Preserve
    ? '.jsx'
    : '.js'

  return outputPath.replace(EXTENSION_REGEX, newExtension)
}

/**
 * Gets the output JS file path for an input file governed by a composite project.
 * Pulls from the cache if it exists; computes and caches the result otherwise.
 */
/* istanbul ignore next (we leave this for e2e) */
function getAndCacheOutputJSFileName(
  inputFileName: string,
  projectReference: _ts.ResolvedProjectReference,
  files: TSFiles,
) {
  const file = files.get(inputFileName)
  if (file?.projectReference?.outputFileName) {
    return file.projectReference.outputFileName
  }

  const outputFileName = getOutputJavaScriptFileName(inputFileName, projectReference)
  if (file !== undefined) {
    file.projectReference = file.projectReference ?? {
      project: projectReference,
    }
    file.projectReference.outputFileName = outputFileName
  }

  return outputFileName
}

/**
 * @internal
 */
/* istanbul ignore next (we leave this for e2e) */
export function getCompileResultFromReferencedProject(
  fileName: string,
  configs: ConfigSet,
  files: TSFiles,
  referencedProject: _ts.ResolvedProjectReference,
): SourceOutput {
  const [relativeProjectConfigPath, relativeFilePath] = [
    configs.resolvePath(referencedProject.sourceFile.fileName),
    configs.resolvePath(fileName),
  ]
  if (referencedProject.commandLine.options.outFile !== undefined) {
    throw new Error(
      `The referenced project at ${relativeProjectConfigPath} is using ` +
        "the outFile' option, which is not supported with ts-jest.",
    )
  }

  const jsFileName = getAndCacheOutputJSFileName(fileName, referencedProject, files)
  const relativeJSFileName = configs.resolvePath(jsFileName)
  if (!configs.compilerModule.sys.fileExists(jsFileName)) {
    throw new Error(
      'Could not find output JavaScript file for input ' +
        `${relativeFilePath} (looked at ${relativeJSFileName}).\n` +
        'The input file is part of a project reference located at ' +
        `${relativeProjectConfigPath}, so ts-jest is looking for the ` +
        'project’s pre-built output on disk. Try running `tsc --build` ' +
        'to build project references.',
    )
  }

  const mapFileName = `${jsFileName}.map`
  const outputText = configs.compilerModule.sys.readFile(jsFileName)
  const sourceMapText = configs.compilerModule.sys.readFile(mapFileName)

  return [outputText!, sourceMapText!]
}
