const path = require('path')
const { lstatSync, existsSync } = require('fs')
const glob = require('glob')

const rootDir = path.resolve(__dirname, '..', '..')
const pkgDigestFile = path.join(rootDir, '.ts-jest-digest')
const rawCompilerOptionsFileName = path.join('src', 'raw-compiler-options.ts')
const generatedPath = path.join(process.cwd(), rawCompilerOptionsFileName)
const exampleAppsToRun = glob
  .sync(`${path.join(rootDir, 'examples')}/*`)
  .filter((examplePath) => lstatSync(examplePath).isDirectory() && existsSync(path.join(examplePath, 'package.json')))
  .sort()

module.exports = {
  pkgDigestFile,
  rootDir,
  generatedPath,
  rawCompilerOptionsFileName,
  exampleAppsToRun,
}
