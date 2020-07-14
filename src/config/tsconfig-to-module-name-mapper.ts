import * as path from 'path'

import {
  TsPathMapping,
  pathsToModuleNameMapper,
  ModuleNameMapperOpts,
  JestPathMapping,
} from './paths-to-module-name-mapper'
import { ProjectReference, projectsToModuleNameMapper } from './projects-to-module-name-mapper'
import { getJson } from './getJson'

interface TsConfig {
  compilerOptions: {
    paths: TsPathMapping
  }
  references: ProjectReference[]
}

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
  const tsConfigJsonPath = path.join(tsConfigDir, 'tsconfig.json')
  const tsConfigJson: TsConfig = getJson(tsConfigJsonPath)

  const { compilerOptions, references } = tsConfigJson
  const { paths } = compilerOptions || {}

  return {
    ...(paths ? pathsToModuleNameMapper(paths, opts) : {}),
    ...(references ? projectsToModuleNameMapper(tsConfigDir, references) : {}),
  }
}
