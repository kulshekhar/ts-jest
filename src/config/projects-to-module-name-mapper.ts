import * as path from 'path'
import { rootLogger } from '../util/logger'
import { LogContexts } from 'bs-logger'
import { JestPathMapping } from './paths-to-module-name-mapper'
import { getPackageJson } from './getJson'
import { ProjectReference } from 'typescript'
import { getTsConfig } from './getTsConfig'

const logger = rootLogger.child({ [LogContexts.namespace]: 'path-mapper' })

/**
 * Reads the typescript project references configuration of a tsconfig
 * file and generates a moduleNameMapper instructing jest to load each
 * project from the path provided.
 *
 * This implementation loads the contents of the tsConfig json file
 * from disk, given the path.
 *
 * @param tsConfigDir The path of the directory containing the project's tsconfig.json. Usually the same dir as the jest.config.js, so you can use __dirname.
 */
export const projectsToModuleNameMapper = (
  tsConfigDir: string,
  references: readonly ProjectReference[],
): JestPathMapping => {
  const mapper: Record<string, string> = {}

  for (const ref of references) {
    const location = path.resolve(tsConfigDir, ref.path)

    // Get the package.json contents of the referenced project.
    const packageJson = getPackageJson(location)

    if (!packageJson) {
      logger.warn(`No 'package.json' at project ref location: ${location}`)
      continue
    }

    // Get the tsconfig.json contents of the referenced project.
    const tsConfig = getTsConfig(location)

    if (!tsConfig) {
      logger.warn(`No 'tsconfig.json' at project ref location: ${location}`)
      continue
    }

    // Extract name, main, outDir and rootDir values.
    const name = packageJson.name
    const main = packageJson.main
    const { outDir, rootDir } = tsConfig.options || {}

    // If there is no main or outDir configured, resolve index at the project root.
    if (!main || !outDir) {
      mapper[name] = location
      continue
    }

    // Get the relative path of the main entry to the project root.

    const subPath = path.relative(outDir, path.join(location, main))
    const stem = subPath.replace(/\.(jsx?|tsx?)/, '')

    // If there's not rootDir, artifacts in outDir are relative to the project root.
    if (!rootDir) {
      mapper[name] = path.join(location, stem)
      continue
    }

    // If we are using a rootDir, look for the relative path of the main entry in the rootDir.
    mapper[name] = path.join(rootDir, stem)
  }

  return mapper
}
