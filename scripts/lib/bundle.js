const npm = require('./npm')
const logger = require('./logger')
const { rootDir, pkgDigestFile } = require('./paths')
const { join, resolve } = require('path')
const { readFileSync, statSync, writeFileSync, existsSync } = require('fs-extra')
const { createHash } = require('crypto')
const { sync: globIgnore } = require('glob-gitignore')

// This will trigger the build as well (not using yarn since yarn pack is buggy)
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

function readPackageDigest() {
  return existsSync(pkgDigestFile) ? readFileSync(pkgDigestFile, 'utf8') : undefined
}

function computePackageDigest(noWriteFile = false) {
  const files = globIgnore(join(rootDir, '**'), {
    absolute: true,
    ignore: readFileSync(join(rootDir, '.npmignore'))
      .toString('utf8')
      .split(/\n/g)
      .filter(l => l && !/^(\s*#.+|\s*)$/.test(l)),
  })
  const hash = createHash('sha1')
  files.sort().forEach(file => {
    if (file === pkgDigestFile || statSync(file).isDirectory()) return
    hash.update(readFileSync(resolve(file)))
    hash.update('\x00')
  })
  const digest = hash.digest('hex')
  if (!noWriteFile) {
    writeFileSync(pkgDigestFile, digest, 'utf8')
  }
  return digest
}

module.exports = {
  createBundle,
  computePackageDigest,
  readPackageDigest,
}
