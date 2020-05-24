import { Config } from '@jest/types'
import { LogContexts } from 'bs-logger'
import { CompilerOptions } from 'typescript'

import { rootLogger } from '../util/logger'
import { Errors, interpolate } from '../util/messages'

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
    } else if (toPaths.length > 1) {
      logger.warn(
        interpolate(Errors.MappingOnlyFirstTargetOfPath, {
          path: fromPath,
          count: toPaths.length,
        }),
      )
    }
    const target = toPaths[0]

    // split with '*'
    const segments = fromPath.split(/\*/g)
    if (segments.length === 1) {
      pattern = `^${escapeRegex(fromPath)}$`
      jestMap[pattern] = `${prefix}${target}`
    } else if (segments.length === 2) {
      pattern = `^${escapeRegex(segments[0])}(.*)${escapeRegex(segments[1])}$`
      jestMap[pattern] = `${prefix}${target.replace(/\*/g, '$1')}`
    } else {
      logger.warn(interpolate(Errors.NotMappingMultiStarPath, { path: fromPath }))
      continue
    }
  }

  return jestMap
}
