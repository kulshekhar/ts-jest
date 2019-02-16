import { Logger } from 'bs-logger'
import { Stats, existsSync, readFileSync, realpathSync, statSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { sync as resolveSync } from 'resolve'

import { IPackageJson } from '../types'
import { Errors } from '../util/messages'

export function getJestConfigPkg<TJestConfig>(logger: Logger): TJestConfig {
  try {
    const jestPath: string = resolvePackagePath('jest', __dirname)
    const jestCliPath: string = resolvePackagePath('jest-cli', jestPath)
    const jestConfigPath: string = resolvePackagePath('jest-config', jestCliPath)

    const jestConfigPackageJson: IPackageJson = require(join(jestConfigPath, 'package.json'))
    const jestConfigMainPath: string = resolve(jestConfigPath, jestConfigPackageJson.main)
    return require(jestConfigMainPath)
  } catch (error) {
    logger.error({ error }, Errors.UnableToResolveJestConfig)
    return {} as TJestConfig
  }
}

function resolvePackagePath(packageName: string, baseDir: string): string {
  const packageJsonPath: string = resolveSync(packageName, {
    basedir: baseDir,
    packageFilter: (packageJson: IPackageJson) => {
      packageJson.main = 'package.json'
      return packageJson
    },
    readFileSync,
    isFile,
  })

  const realPackageJsonPath: string = realpathSync(packageJsonPath)
  return dirname(realPackageJsonPath)
}

function isFile(filePath: string): boolean {
  if (existsSync(filePath)) {
    const stats: Stats = statSync(filePath)
    return stats.isFile()
  } else {
    return false
  }
}
