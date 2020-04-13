import { Logger } from 'bs-logger'
import { writeFileSync } from 'fs'
import micromatch = require('micromatch')
import { join, normalize } from 'path'
import * as _ts from 'typescript'

import { MemoryCache } from '../types'
import { sha1 } from '../util/sha1'

/**
 * @internal
 */
export const hasOwn = Object.prototype.hasOwnProperty
/**
 * @internal
 */
export function getResolvedModulesCache(cachedir: string): string {
  return join(cachedir, sha1('ts-jest-resolved-modules', '\x00'))
}

/**
 * @internal
 * Get resolved modules of a test file and put into memory cache
 */
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
    logger.debug({ fileName }, `cacheResolvedModules(): get resolved modules of test file ${fileName}`)

    memoryCache.resolvedModules[fileName] = Object.create(null)
    memoryCache.resolvedModules[fileName].modulePaths = importReferences
      .filter((importReference: any) => importReference.parent.parent.resolvedModules?.get(importReference.text))
      .map((importReference: any) => {
        return normalize(
          (importReference.parent.parent.resolvedModules.get(importReference.text) as _ts.ResolvedModule)
            .resolvedFileName,
        )
      })
      .reduce((a: any, b: any) => a.concat(b), [])
    memoryCache.resolvedModules[fileName].testFileContent = fileContent
    writeFileSync(getResolvedModulesCache(cacheDir), JSON.stringify(memoryCache.resolvedModules))
  }
}

export function isTestFile(testMatchPatterns: (string | RegExp)[], fileName: string) {
  return testMatchPatterns.some(pattern =>
    typeof pattern === 'string' ? micromatch.isMatch(fileName, pattern) : pattern.test(fileName),
  )
}
