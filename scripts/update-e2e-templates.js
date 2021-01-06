#!/usr/bin/env node
'use strict'

const path = require('path')

const execa = require('execa')
const fs = require('fs-extra')

const logger = require('./lib/logger')
const { projectsToRun } = require('./lib/paths')
const Paths = require('./lib/paths')

const prepareAndExecuteCmd = (tmplPath, wantedDependencies, useNpm) => {
  let args = []
  Object.keys(wantedDependencies).forEach((key) => {
    args.push(`${key}@${wantedDependencies[key]}`) // eslint-disable-line @typescript-eslint/restrict-template-expressions
  })
  args = useNpm ? ['i', '-s', '-D', '-E'].concat(args) : ['add', '-D', '-W'].concat(args)

  logger.log(`    ↳ ${useNpm ? 'npm' : 'yarn'} ${args.filter((a) => a !== '-s').join(' ')}`)

  execa.sync(`${useNpm ? 'npm' : 'yarn'}`, args, { cwd: tmplPath })

  logger.log('    cleaning-up')

  fs.removeSync(path.join(tmplPath, 'node_modules'))
}

logger.log('Updating E2E template dependency versions (this might take a while)')

const templateDirs = fs
  .readdirSync(Paths.e2eTemplatesDir)
  .filter((f) => fs.statSync(path.join(Paths.e2eTemplatesDir, f)).isDirectory())
templateDirs.forEach((tmpl, i) => {
  const tmplPath = path.join(Paths.e2eTemplatesDir, tmpl)

  logger.log(`[${i + 1}/${templateDirs.length}] updating dependencies of ${tmpl}:`)

  process.chdir(tmplPath)
  const wantedDependencies = require(path.join(tmplPath, 'package.json')).wantedDependencies

  if (!wantedDependencies) throw new Error('The package.json must have a "wantedDependencies" section.')

  prepareAndExecuteCmd(tmplPath, wantedDependencies, true)
})

logger.log('Updating E2E external repositories dependency versions (this might take a while)')

projectsToRun.forEach((projectPath, i) => {
  logger.log(`[${i + 1}/${projectsToRun.length}] updating dependencies of ${projectPath}:`)

  process.chdir(projectPath)
  const wantedDependencies = require(path.join(projectPath, 'package.json')).wantedDependencies

  if (!wantedDependencies) throw new Error('The package.json must have a "wantedDependencies" section.')

  const useNpm = fs.existsSync(path.join(projectPath, 'package-lock.json'))

  prepareAndExecuteCmd(projectPath, wantedDependencies, useNpm)
})

logger.log('Done!')
process.exit(0)
