#!/usr/bin/env node

const { removeSync } = require('fs-extra')
const { join } = require('path')

const Paths = require('./lib/paths')

if (process.argv.includes('--when-ci-commit-message')) {
  let msg = process.env.TRAVIS_COMMIT_MESSAGE || process.env.APPVEYOR_REPO_COMMIT_MESSAGE
  if (!msg) {
    throw new Error('Unable to guess the commit message from CI env variables')
  }
  if (process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED) {
    msg = `${msg}\n${process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED}`
  }
  if (!msg.includes('[ci clean]')) process.exit(0)
}

removeSync(Paths.distDir)
removeSync(join(Paths.testsRootDir, '*', 'coverage'))
removeSync(join(Paths.testsRootDir, '*', 'debug.txt'))
removeSync(join(Paths.testsRootDir, '*', 'node_modules'))
removeSync(join(Paths.e2eSourceDir, '*', 'node_modules'))
removeSync(join(Paths.e2eTemplatesDir, '*', 'node_modules'))
removeSync(Paths.cacheDir)
removeSync(Paths.e2eWorkDir)
removeSync(Paths.e2eWorkDirLink)
