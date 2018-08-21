const npm = require('./npm')
const logger = require('./logger')
const { rootDir } = require('./paths')
const { join, resolve } = require('path')
const { readFileSync, statSync } = require('fs')
const { createHash } = require('crypto')
const { sync: globIgnore } = require('glob-gitignore')

// This will trigger the build as well (not using yarn since yarn pack is bugy)
// Except that on npm < 4.0.0 the prepare doesn't exists

function createBundle(log = logger.log.bind(logger)) {
  if (!npm.can.prepare()) {
    log('building ts-jest')
    npm.spawnSync(['-s', 'run', 'build'], { cwd: rootDir })
  }
  log('creating ts-jest bundle')
  const res = npm.spawnSync(['-s', 'pack'], { cwd: rootDir })
  return join(rootDir, res.stdout.toString().trim())
}

function packageDigest() {
  const files = globIgnore(join(rootDir, '**'), {
    ignore: readFileSync(join(rootDir, '.npmignore'))
      .toString('utf8')
      .split(/\n/g)
      .filter(l => l && !/^(\s*#.+|\s*)$/.test(l)),
  })
  const hash = createHash('sha1')
  files.sort().forEach(file => {
    if (statSync(file).isDirectory()) return
    hash.update(readFileSync(resolve(file)))
    hash.update('\x00')
  })
  return hash.digest('hex')
}

module.exports = {
  createBundle,
  packageDigest,
}
