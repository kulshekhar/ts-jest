#!/usr/bin/env node
'use strict'

const { spawnSync } = require('./lib/spawn-sync')
const { resolve, join } = require('path')
const { tmpdir } = require('os')
const { rootDir } = require('./lib/paths')
const { existsSync, realpathSync } = require('fs')
const logger = require('./lib/logger')
const { createBundle } = require('./lib/bundle')
const npm = require('./lib/npm')

let projectPath = process.argv[2]
const jestArgs = process.argv.slice(3)
let gitUrl = false
const externalRepoPath = 'e2e/__external-repos__'
const PROJECTS_TO_RUN = [
  `${externalRepoPath}/simple/with-dependency`,
  `${externalRepoPath}/simple-project-references`,
  `${externalRepoPath}/yarn-workspace-composite`,
]

const randomStr = () => parseInt(Math.random() * 1e17, 10).toString(36)
const executeTest = (monorepoRealPath, bundle) => {
  // if it's a git URL we first need to clone
  if (gitUrl) {
    logger.log('found what could be a git URL, trying to clone')
    spawnSync('git', ['clone', gitUrl, monorepoRealPath])
  }

  // we change current directory
  process.chdir(monorepoRealPath)

  // reading package.json
  const projectPkg = require(join(monorepoRealPath, 'package.json'))
  if (!projectPkg.name) projectPkg.name = 'unknown'
  if (!projectPkg.version) projectPkg.version = 'unknown'

  logger.log()
  logger.log(
    '='.repeat(20),
    `${projectPkg.name}@${projectPkg.version}`,
    'in',
    monorepoRealPath,
    '='.repeat(20)
  )
  logger.log()

  // then we install it in the repo
  logger.log('ensuring all depedencies of target project are installed')
  npm.spawnSync(
    ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save'],
    { cwd: monorepoRealPath }
  )
  logger.log('installing bundled version of ts-jest')
  npm.spawnSync(
    ['install', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle],
    { cwd: monorepoRealPath }
  )

  // then we can run the tests
  const useYarn = existsSync(join(monorepoRealPath, 'yarn.lock'))
  const cmdLine =
    projectPkg.scripts && projectPkg.scripts.test
      ? [(useYarn ? 'yarn' : 'npm'), 'test']
      : ['jest']
  if (jestArgs.length) {
    cmdLine.push('--')
    cmdLine.push(...jestArgs)
  }

  logger.log('starting the tests using:', ...cmdLine)
  logger.log()

  spawnSync(cmdLine.shift(), cmdLine, {
    cwd: monorepoRealPath,
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      TS_JEST_IGNORE_DIAGNOSTICS: '5023,5024',
    }),
  })
}

if (/^((https|ssh|git):\/\/|[a-z0-9]+@[a-z0-9.]+:).+$/.test(projectPath)) {
  gitUrl = projectPath
  projectPath = resolve(tmpdir(), 'ts-jest-git-ext', randomStr(), randomStr())
} else {
  if (projectPath === 'external-repos') {
    const cwd = process.cwd()
    // first we need to create a bundle
    const bundle = createBundle()
    PROJECTS_TO_RUN.forEach(monorepoPath => {
      let monorepoRealPath
      try {
        monorepoRealPath = realpathSync(resolve(cwd, monorepoPath))
      } catch (e) {
        monorepoRealPath = undefined
      }
      if (
        !monorepoRealPath ||
        !existsSync(join(monorepoRealPath, 'package.json')) ||
        monorepoRealPath === rootDir
      ) {
        logger.error('First argument must be the path to a project or a git URL')
        process.exit(1)
      } else {
        executeTest(monorepoRealPath, bundle)
      }
    })
  } else {
    executeTest(projectPath)
  }
}
