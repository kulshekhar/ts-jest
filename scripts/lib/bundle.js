const { createHash } = require('crypto')
const { join, resolve } = require('path')

const execa = require('execa')
const { readFileSync, statSync, writeFileSync, existsSync } = require('fs-extra')
const { sync: globIgnore } = require('glob-gitignore')

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
  const files = globIgnore(join(rootDir, '**'), {
    absolute: true,
    ignore: readFileSync(join(rootDir, '.npmignore'))
      .toString('utf8')
      .split(/\n/g)
      .filter((l) => l && !/^(\s*#.+|\s*)$/.test(l)),
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
