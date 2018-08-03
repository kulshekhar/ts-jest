const path = require('path');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const testsRootDir = path.join(rootDir, 'tests');
const e2eRootDir = path.join(rootDir, 'e2e');
const e2eSourceDir = path.join(e2eRootDir, '__cases__');
const e2eTestsDir = path.join(e2eRootDir, '__tests__');
const e2eWorkDir = path.join(os.tmpdir(), '--ts-jest-temp-e2e--');
const e2eWorkTemplateDir = path.join(e2eWorkDir, '__template__');
const e2eWotkDirLink = path.join(e2eRootDir, '__e2e_workdir_link__');

module.exports = {
  rootDir,
  e2eSourceDir,
  e2eRootDir,
  e2eWorkDir,
  e2eWorkTemplateDir,
  e2eWotkDirLink,
  distDir,
  testsRootDir,
  e2eTestsDir,
};
