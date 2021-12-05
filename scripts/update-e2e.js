const { exampleAppsToRun } = require('./lib/paths')
const execa = require('execa')
const path = require('path')
const logger = require('./lib/logger')
const glob = require('glob')

logger.log()
logger.log(`Updating e2e dependencies' versions (this might take a while)`)
logger.log()

glob.sync(`${path.join(process.cwd(), 'e2e')}/**/package-lock.json`).forEach((lockFilePath, idx, allPaths) => {
  const dirPath = path.dirname(lockFilePath)

  logger.log(`[${idx + 1}/${allPaths.length}] updating dependencies of ${path.dirname(dirPath)}:`)

  process.chdir(dirPath)

  logger.log(`installing dependencies of ${dirPath}:`)

  execa.sync('npm', ['ci'], { cwd: dirPath })

  logger.log('upgrading all dependencies using npm update')

  execa.sync('npm', ['update'])

  logger.log('    cleaning-up')

  execa.sync('rimraf', [path.join(dirPath, 'node_modules')])
})

logger.log()
logger.log(`Updating example apps dependencies' versions (this might take a while)`)
logger.log()

exampleAppsToRun.forEach((projectPath, idx) => {
  logger.log(`[${idx + 1}/${exampleAppsToRun.length}] updating example app dependencies of ${projectPath}:`)
  process.chdir(projectPath)

  logger.log(`installing dependencies of ${projectPath}:`)

  execa.sync('npm', ['ci'], { cwd: projectPath })

  logger.log(`    ↳ running npm update`)

  execa.sync('npm', ['update'], { cwd: projectPath })

  logger.log('    cleaning-up')

  execa.sync('rimraf', [path.join(projectPath, 'node_modules')])
})

logger.log()
logger.log('Done!')
process.exit(0)
