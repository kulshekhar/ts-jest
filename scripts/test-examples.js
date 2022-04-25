const path = require('path')

const execa = require('execa')

const logger = require('./lib/logger')
const { exampleAppsToRun } = require('./lib/paths')
const { createBundle } = require('./lib/bundle')

const bundle = createBundle()

const executeTest = (projectPath) => {
  // we change current directory
  process.chdir(projectPath)
  // reading package.json
  const projectPkg = require(path.join(projectPath, 'package.json'))
  if (!projectPkg.name) projectPkg.name = 'unknown'
  if (!projectPkg.version) projectPkg.version = 'unknown'

  logger.log()
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  logger.log('='.repeat(20), `${projectPkg.name}@${projectPkg.version}`, 'in', projectPath, '='.repeat(20))
  logger.log()

  // then we install it in the repo
  logger.log('ensuring all dependencies of target project are installed')
  logger.log()

  execa.sync('npm', ['ci'], { cwd: projectPath })
  logger.log()

  logger.log('installing bundled version of ts-jest')
  logger.log()

  execa.sync('npm', ['install', '--legacy-peer-deps', '--no-package-lock', '--no-shrinkwrap', '--no-save', bundle], {
    cwd: projectPath,
  })
  logger.log()

  // then we can run the tests
  const cmdLine = ['npm', 'run', 'test']
  const cmdIsolatedLine = ['npm', 'run', 'test-isolated']
  const cmdESMLine = ['npm', 'run', 'test-esm']
  const cmdESMIsolatedLine = ['npm', 'run', 'test-esm-isolated']

  logger.log('starting the CommonJS tests with `isolatedModules: false` using:', ...cmdLine)
  logger.log()

  execa.sync(cmdLine.shift(), cmdLine, {
    cwd: projectPath,
    stdio: 'inherit',
    env: process.env,
  })
  logger.log()

  logger.log('starting the CommonJS tests with `isolatedModules: true` using:', ...cmdIsolatedLine)
  logger.log()

  execa.sync(cmdIsolatedLine.shift(), cmdIsolatedLine, {
    cwd: projectPath,
    stdio: 'inherit',
    env: process.env,
  })
  logger.log()

  logger.log('starting the ESM tests with `isolatedModules: false` using:', ...cmdESMLine)
  logger.log()

  execa.sync(cmdESMLine.shift(), cmdESMLine, {
    cwd: projectPath,
    stdio: 'inherit',
    env: process.env,
  })
  logger.log()

  logger.log('starting the ESM tests with `isolatedModules: true` using:', ...cmdESMIsolatedLine)
  logger.log()

  execa.sync(cmdESMIsolatedLine.shift(), cmdESMIsolatedLine, {
    cwd: projectPath,
    stdio: 'inherit',
    env: process.env,
  })
  logger.log()
}

exampleAppsToRun.forEach((projectPath) => {
  executeTest(projectPath)
})
