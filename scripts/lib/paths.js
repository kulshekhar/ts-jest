const path = require('path')
const os = require('os')

const rootDir = path.resolve(__dirname, '..', '..')
const pkgDigestFile = path.join(rootDir, '.ts-jest-digest')
const distDir = path.join(rootDir, 'dist')
const testsRootDir = path.join(rootDir, 'tests')
const e2eRootDir = path.join(rootDir, 'e2e')
const e2eSourceDir = path.join(e2eRootDir, '__cases__')
const e2eTestsDir = path.join(e2eRootDir, '__tests__')
const e2eTemplatesDir = path.join(e2eRootDir, '__templates__')
const e2eWorkDir = process.env.TS_JEST_E2E_WORKDIR
  ? process.env.TS_JEST_E2E_WORKDIR
  : path.join(os.tmpdir(), '--ts-jest-temp-e2e--')
const e2eWorkTemplatesDir = path.join(e2eWorkDir, '__templates__')
const e2eWotkDirLink = path.join(e2eRootDir, '__workdir_synlink__')

module.exports = {
  pkgDigestFile,
  rootDir,
  e2eSourceDir,
  e2eRootDir,
  e2eWorkDir,
  e2eWorkTemplatesDir,
  e2eTemplatesDir,
  e2eWotkDirLink,
  distDir,
  testsRootDir,
  e2eTestsDir,
}
