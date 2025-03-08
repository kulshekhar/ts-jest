const path = require('path')

const execa = require('execa')

const { createBundle } = require('./lib/bundle')
const logger = require('./lib/logger')

const bundle = createBundle()

const executeTest = () => {
  const projectPath = path.join(process.cwd(), 'examples')
  process.chdir(projectPath)

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

  const cmdLine = ['npm', 'run', 'test-all']

  execa.sync(cmdLine.shift(), cmdLine, {
    cwd: projectPath,
    stdio: 'inherit',
    env: process.env,
  })
  logger.log()
}

executeTest()
