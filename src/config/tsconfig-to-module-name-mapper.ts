import { pathsToModuleNameMapper, ModuleNameMapperOpts, JestPathMapping } from './paths-to-module-name-mapper'
import { projectsToModuleNameMapper } from './projects-to-module-name-mapper'
import { rootLogger } from '../util/logger'
import { LogContexts } from 'bs-logger'
import { getTsConfig } from './getTsConfig'

export const logger = rootLogger.child({ [LogContexts.namespace]: 'path-mapper' })

/**
 * A convenience mapper, that reads a project's tsconfig and
 * generates a moduleNameMapper from both the 'paths' and 'references'
 * configurations.
 *
 * This implementation loads the contents of the tsConfig json file
 * from disk, given the path.
 *
 * @param tsConfigDir The path of the directory containing the project's tsconfig.json. Usually the same dir as the jest.config.js, so you can use __dirname.
 * @param opts The options to use for generating 'paths' mappings. Doesn't affect project reference mappings.
 */
export const tsConfigToModuleNameMapper = (tsConfigDir: string, opts: ModuleNameMapperOpts = {}): JestPathMapping => {
  const config = getTsConfig(tsConfigDir)

  if (!config) {
    logger.warn(`Couldn't find parent 'tsconfig.json' from dir:`, tsConfigDir)

    return {}
  }

  const { options, projectReferences } = config
  const { paths } = options || {}

  return {
    ...(paths ? pathsToModuleNameMapper(paths, opts) : {}),
    ...(projectReferences ? projectsToModuleNameMapper(tsConfigDir, projectReferences) : {}),
  }
}
