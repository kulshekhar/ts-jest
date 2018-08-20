const npm = require('./npm')
const logger = require('./logger')
const { rootDir } = require('./paths')
const { join } = require('path')

// This will trigger the build as well (not using yarn since yarn pack is bugy)
// Except that on npm < 4.0.0 the prepare doesn't exists

module.exports = function createBundle() {
  if (!npm.can.prepare) {
    logger.log('building ts-jest')
    npm.spawnSync(['-s', 'run', 'build'], { cwd: rootDir })
  }
  logger.log('creating ts-jest bundle')
  const res = npm.spawnSync(['-s', 'pack'], { cwd: rootDir })
  return join(rootDir, res.stdout.toString().trim())
}
