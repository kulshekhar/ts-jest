const os = require('os')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const rootDir = path.resolve(__dirname, '..', '..')
const cacheDir = path.join(rootDir, '.cache')
const pkgDigestFile = path.join(rootDir, '.ts-jest-digest')
const distDir = path.join(rootDir, 'dist')
const testsRootDir = path.join(rootDir, 'tests')
const e2eRootDir = path.join(rootDir, 'e2e')
const e2eSourceDir = path.join(e2eRootDir, '__cases__')
const e2eTestsDir = path.join(e2eRootDir, '__tests__')
const e2eTemplatesDir = path.join(e2eRootDir, '__templates__')
const e2eExternalRepoDir = path.join(e2eRootDir, '__external-repos__')
const e2eWorkDir = process.env.TS_JEST_E2E_WORKDIR
  ? process.env.TS_JEST_E2E_WORKDIR
  : path.join(os.tmpdir(), '--ts-jest-temp-e2e--')
const e2eWorkTemplatesDir = path.join(e2eWorkDir, '__templates__')
const e2eWorkDirLink = path.join(e2eRootDir, '__workdir_synlink__')
const projectsToRun = glob
  .sync(`${e2eExternalRepoDir}/*`)
  .filter((e2ePath) => fs.lstatSync(e2ePath).isDirectory() && fs.existsSync(path.join(e2ePath, 'package.json')))
  .sort()
projectsToRun.push(`${e2eExternalRepoDir}/simple/with-dependency`)
const rawCompilerOptionsFileName = path.join('src', 'raw-compiler-options.ts')
const generatedPath = path.join(process.cwd(), rawCompilerOptionsFileName)

module.exports = {
  pkgDigestFile,
  cacheDir,
  rootDir,
  e2eSourceDir,
  e2eRootDir,
  e2eWorkDir,
  e2eWorkTemplatesDir,
  e2eTemplatesDir,
  e2eWorkDirLink,
  distDir,
  testsRootDir,
  e2eTestsDir,
  projectsToRun,
  generatedPath,
  rawCompilerOptionsFileName,
}
