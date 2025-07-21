const { createHash } = require('crypto')
const { join, resolve } = require('path')

const execa = require('execa')
const glob = require('fast-glob')
const { readFileSync, statSync, writeFileSync, existsSync } = require('fs-extra')

const logger = require('./logger')
const { rootDir, pkgDigestFile } = require('./paths')

// This will trigger the build as well (not using yarn since yarn pack is buggy)
function createBundle(log = logger.log.bind(logger)) {
  log('creating ts-jest bundle')

  const res = execa.sync('npm', ['-s', 'pack'], { cwd: rootDir })

  return join(rootDir, res.stdout.toString().trim())
}

function readPackageDigest() {
  return existsSync(pkgDigestFile) ? readFileSync(pkgDigestFile, 'utf8') : undefined
}

function computePackageDigest(noWriteFile = false) {
  const npmIgnoreFile = join(rootDir, '.npmignore')
  const ignorePatterns = existsSync(npmIgnoreFile)
    ? readFileSync(npmIgnoreFile)
        .toString('utf8')
        .split(/\n/g)
        .filter((l) => l && !/^(\s*#.+|\s*)$/.test(l))
    : []
  const files = glob.sync('**', {
    cwd: rootDir,
    absolute: true,
    ignore: ignorePatterns,
    nodir: true,
    dot: true,
  })
  const hash = createHash('sha1')
  files.sort().forEach((file) => {
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
