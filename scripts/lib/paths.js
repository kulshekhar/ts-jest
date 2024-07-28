const path = require('path')

const rootDir = path.resolve(__dirname, '..', '..')
const pkgDigestFile = path.join(rootDir, '.ts-jest-digest')
const rawCompilerOptionsFileName = path.join('src', 'raw-compiler-options.ts')
const generatedPath = path.join(process.cwd(), rawCompilerOptionsFileName)

module.exports = {
  pkgDigestFile,
  rootDir,
  generatedPath,
  rawCompilerOptionsFileName,
}
