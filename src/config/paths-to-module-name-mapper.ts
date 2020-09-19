import type { Config } from '@jest/types'
import { LogContexts } from 'bs-logger'
import type { CompilerOptions } from 'typescript'

import { rootLogger } from '../utils/logger'
import { Errors, interpolate } from '../utils/messages'
import { join } from 'path'
import { normalizeSlashes } from '../utils/normalize-slashes'

type TsPathMapping = Exclude<CompilerOptions['paths'], undefined>
type JestPathMapping = Config.InitialOptions['moduleNameMapper']

// we don't need to escape all chars, so commented out is the real one
// const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
const escapeRegex = (str: string) => str.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')

const logger = rootLogger.child({ [LogContexts.namespace]: 'path-mapper' })

export const pathsToModuleNameMapper = (
  mapping: TsPathMapping,
  { prefix = '' }: { prefix?: string } = {},
): JestPathMapping => {
  const jestMap: JestPathMapping = {}
  for (const fromPath of Object.keys(mapping)) {
    let pattern: string
    const toPaths = mapping[fromPath]
    // check that we have only one target path
    if (toPaths.length === 0) {
      logger.warn(interpolate(Errors.NotMappingPathWithEmptyMap, { path: fromPath }))

      continue
    }

    // split with '*'
    const segments = fromPath.split(/\*/g)
    if (segments.length === 1) {
      const paths = toPaths.map((target) => normalizeSlashes(join(prefix, target)))
      pattern = `^${escapeRegex(fromPath)}$`
      jestMap[pattern] = paths.length === 1 ? paths[0] : paths
    } else if (segments.length === 2) {
      const paths = toPaths.map((target) => normalizeSlashes(join(prefix, target.replace(/\*/g, '$1'))))
      pattern = `^${escapeRegex(segments[0])}(.*)${escapeRegex(segments[1])}$`
      jestMap[pattern] = paths.length === 1 ? paths[0] : paths
    } else {
      logger.warn(interpolate(Errors.NotMappingMultiStarPath, { path: fromPath }))
    }
  }

  return jestMap
}
