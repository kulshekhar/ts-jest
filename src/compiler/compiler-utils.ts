import { Logger } from 'bs-logger'
import { writeFileSync } from 'fs'
import { join, normalize } from 'path'
import * as _ts from 'typescript'

import { MemoryCache } from '../types'
import { sha1 } from '../util/sha1'
import { stringify } from '../util/json'

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
): void {
  /* eslint-disable-next-line  @typescript-eslint/ban-ts-comment */
  // @ts-expect-error
  const importReferences = program.getSourceFile(fileName)!.imports // eslint-disable-line @typescript-eslint/no-non-null-assertion
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
    writeFileSync(getResolvedModulesCache(cacheDir), stringify(memoryCache.resolvedModules))
  }
}
