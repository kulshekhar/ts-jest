#!/usr/bin/env node

const { removeSync } = require('fs-extra')
const Paths = require('./paths')
const { join } = require('path')

if (process.argv.indexOf('--when-ci-commit-message') !== -1) {
  let msg =
    process.env.TRAVIS_COMMIT_MESSAGE ||
    process.env.APPVEYOR_REPO_COMMIT_MESSAGE
  if (!msg)
    throw new Error(`Unable to guess the commit message from CI env variables`)
  if (process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED) {
    msg = `${msg}\n${process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED}`
  }
  if (!/\[ci npm-clean\]/.test(msg)) return
}

removeSync(Paths.distDir)
removeSync(join(Paths.testsRootDir, '*', 'coverage'))
removeSync(join(Paths.testsRootDir, '*', 'debug.txt'))
removeSync(join(Paths.testsRootDir, '*', 'node_modules'))
removeSync(join(Paths.e2eSourceDir, '*', 'node_modules'))
removeSync(join(Paths.e2eTemplatesDir, '*', 'node_modules'))
removeSync(Paths.e2eWorkDir)
removeSync(Paths.e2eWotkDirLink)
