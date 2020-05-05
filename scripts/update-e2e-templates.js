#!/usr/bin/env node
'use strict'

const { spawnSync } = require('./lib/spawn-sync')
const fs = require('fs-extra')
const path = require('path')
const Paths = require('./lib/paths')
const logger = require('./lib/logger')

logger.log('Updating E2E template dependency versions (this might take a while)')
const templateDirs = fs
  .readdirSync(Paths.e2eTemplatesDir)
  .filter(f => fs.statSync(path.join(Paths.e2eTemplatesDir, f)).isDirectory())
templateDirs.forEach((tmpl, i) => {
  const tmplPath = path.join(Paths.e2eTemplatesDir, tmpl)
  logger.log(`[${i + 1}/${templateDirs.length}] updating dependencies of ${tmpl}:`)
  process.chdir(tmplPath)
  const wanted = require(path.join(tmplPath, 'package.json')).wantedDependencies
  if (!wanted) throw new Error('The package.json must have a "wantedDependencies" section.')

  let args = []
  Object.keys(wanted).forEach(key => {
    args.push(`${key}@${wanted[key]}`)
  })
  args = ['i', '-s', '-D', '-E'].concat(args)
  logger.log(`    ↳ npm ${args.filter(a => a !== '-s').join(' ')}`)
  spawnSync('npm', args, { cwd: tmplPath })
  logger.log('    cleaning-up')
  fs.removeSync(path.join(tmplPath, 'node_modules'))
})

logger.log('Done!')
process.exit(0)
