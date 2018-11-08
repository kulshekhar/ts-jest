import * as fs from 'fs'
import * as path from 'path'
import * as resolve from 'resolve'

import { Logger } from 'bs-logger'

interface IPackageJson {
  main: string
}

export function getJestConfigPkg<TJestConfig>(logger: Logger): TJestConfig {
  try {
    const jestPath: string = resolvePackagePath('jest', __dirname)
    const jestCliPath: string = resolvePackagePath('jest-cli', jestPath)
    const jestConfigPath: string = resolvePackagePath('jest-config', jestCliPath)

    const jestConfigPackageJson: IPackageJson = require(path.join(jestConfigPath, 'package.json'))
    const jestConfigMainPath: string = path.resolve(jestConfigPath, jestConfigPackageJson.main)
    return require(jestConfigMainPath)
  } catch (e) {
    logger.error('Unable to resolve jest-config. Ensure Jest is properly installed.')
    return {} as TJestConfig
  }
}

function resolvePackagePath(packageName: string, baseDir: string): string {
  const packageJsonPath: string = resolve.sync(packageName, {
    basedir: baseDir,
    packageFilter: (packageJson: IPackageJson) => {
      packageJson.main = 'package.json'
      return packageJson
    },
    readFileSync: fs.readFileSync,
    isFile,
  })

  const realPackageJsonPath: string = fs.realpathSync(packageJsonPath)
  return path.dirname(realPackageJsonPath)
}

function isFile(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    const stats: fs.Stats = fs.statSync(filePath)
    return stats.isFile()
  } else {
    return false
  }
}
