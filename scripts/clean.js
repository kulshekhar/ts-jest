#!/usr/bin/env node

const { removeSync } = require('fs-extra')
const Paths = require('./lib/paths')
const { join } = require('path')

if (process.argv.indexOf('--when-ci-commit-message') !== -1) {
  const msg = process.env.TRAVIS_COMMIT_MESSAGE
  if (!msg) throw new Error('Unable to guess the commit message from CI env variables')
  if (!/\[ci clean\]/.test(msg)) process.exit(0)
}

removeSync(Paths.distDir)
removeSync(join(Paths.testsRootDir, '*', 'coverage'))
removeSync(join(Paths.testsRootDir, '*', 'debug.txt'))
removeSync(join(Paths.testsRootDir, '*', 'node_modules'))
removeSync(join(Paths.e2eSourceDir, '*', 'node_modules'))
removeSync(join(Paths.e2eTemplatesDir, '*', 'node_modules'))
removeSync(Paths.cacheDir)
removeSync(Paths.e2eWorkDir)
removeSync(Paths.e2eWotkDirLink)
