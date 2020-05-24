#!/usr/bin/env node
'use strict'

// eslint-disable-next-line jest/no-jest-import
const jest = require('jest')
const { spawnSync } = require('./lib/spawn-sync')
const fs = require('fs-extra')
const path = require('path')
const Paths = require('./lib/paths')
const { createHash } = require('crypto')
const logger = require('./lib/logger')
const { createBundle, readPackageDigest } = require('./lib/bundle')
const npm = require('./lib/npm')

const configFile = path.join(Paths.e2eRootDir, 'jest.config.js')

let parentArgs = process.argv.slice(2)
if (parentArgs.includes('--coverage')) {
  logger.warn('Coverages cannot be activated for e2e tests (but can in each e2e test).')
  parentArgs = parentArgs.filter((a) => a !== '--coverage')
}
if (!parentArgs.includes('--runInBand')) parentArgs.push('--runInBand')
const prepareOnly = parentArgs.includes('--prepareOnly')

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function (file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory()
  })
}

function sha1(...data) {
  const hash = createHash('sha1')
  data.forEach((item) => hash.update(item))

  return hash.digest('hex').toString()
}

function log(...msg) {
  logger.log('[e2e]', ...msg)
}

function setupE2e() {
  // kept on top so that the build is triggered beforehand (pack => prepublish => clean-build => build)
  const bundle = createBundle(log)
  log('bundle created:', path.relative(Paths.rootDir, bundle), '; computing digest')

  // get the hash of the bundle (to know if we should install it again or not)
  const bundleHash = readPackageDigest()
  log('ts-jest digest:', bundleHash)

  // ensure directory exists before copying over
  fs.mkdirpSync(Paths.e2eWorkTemplatesDir)

  // link locally so we could find it easily
  if (!process.env.CI && !fs.existsSync(Paths.e2eWotkDirLink)) {
    fs.symlinkSync(Paths.e2eWorkDir, Paths.e2eWotkDirLink, 'dir')
    log('symbolic link to the work directory created at: ', Paths.e2eWotkDirLink)
  }

  // cleanup files related to old test run
  getDirectories(Paths.e2eWorkDir).forEach((name) => {
    const dir = path.join(Paths.e2eWorkDir, name)
    if (dir === Paths.e2eWorkTemplatesDir) return
    log('cleaning old artifacts in', name)
    fs.removeSync(dir)
  })

  // install with `npm ci` in each template, this is the fastest but needs a package lock file,
  // that is why we end with the npm install of our bundle
  getDirectories(Paths.e2eTemplatesDir).forEach((name) => {
    log('checking template', name)
    const sourceDir = path.join(Paths.e2eTemplatesDir, name)
    const dir = path.join(Paths.e2eWorkTemplatesDir, name)
    const nodeModulesDir = path.join(dir, 'node_modules')
    const pkgLockFile = path.join(sourceDir, 'package-lock.json')
    const e2eFile = path.join(nodeModulesDir, '.ts-jest-e2e.json')

    // log installed versions
    const logPackageVersions = () => {
      log(`  [template: ${name}]`, 'installed direct dependencies:')
      let deps = npm.directDepsPkg(dir)
      Object.keys(deps)
        .sort()
        .forEach((name) => {
          log('      -', `${name}${' '.repeat(20 - name.length)}`, deps[name].version)
        })
      deps = null
    }

    // remove all files expect node_modules
    if (fs.existsSync(dir)) {
      log(`  [template: ${name}]`, 'removing old files')
      fs.readdirSync(dir).forEach((file) => {
        if (file !== 'node_modules') {
          fs.unlinkSync(path.join(dir, file))
        }
      })
    } else {
      fs.mkdirpSync(dir)
    }

    // copy files from template
    log(`  [template: ${name}]`, 'copying files from template source')
    fs.copySync(sourceDir, dir)

    // no package-lock.json => this template doesn't provide any package-set
    if (!fs.existsSync(pkgLockFile)) {
      log(`  [template: ${name}]`, 'not a package-set template, nothing to do')

      return
    }

    const pkgLockHash = sha1(fs.readFileSync(pkgLockFile))
    const e2eData = fs.existsSync(e2eFile) ? fs.readJsonSync(e2eFile) : {}
    let bundleOk = e2eData.bundleHash === bundleHash
    const packagesOk = e2eData.packageLockHash === pkgLockHash

    if (fs.existsSync(nodeModulesDir)) {
      log(`  [template: ${name}]`, 'bundle: ', bundleOk ? 'OK' : 'CHANGED')
      log(`  [template: ${name}]`, 'packages: ', packagesOk ? 'OK' : 'CHANGED')
      if (bundleOk && packagesOk) {
        log(`  [template: ${name}]`, 'bundle and packages unchanged, nothing to do')
        logPackageVersions()

        return
      }
    }

    if (!packagesOk) {
      // faster to remove them first
      log(`  [template: ${name}]`, 'removing `node_modules` directory')
      fs.removeSync(path.join(dir, 'node_modules'))
      if (npm.can.ci()) {
        log(`  [template: ${name}]`, 'installing packages using "npm ci"')
        spawnSync('npm', ['ci'], { cwd: dir })
      } else {
        log(`  [template: ${name}]`, 'installing packages using "npm install"')
        spawnSync('npm', ['i'], { cwd: dir })
      }
      bundleOk = false
    }
    if (!bundleOk) {
      log(`  [template: ${name}]`, 'installing bundle')
      spawnSync('npm', ['i', '-D', bundle], { cwd: dir })
    }

    logPackageVersions()

    // write our data
    e2eData.bundleHash = bundleHash
    e2eData.packageLockHash = pkgLockHash
    log(`  [template: ${name}]`, 'writing manifest')
    fs.outputJsonSync(e2eFile, e2eData, { space: 2 })
  })
}

// ============================================================================

setupE2e()

log('templates are ready')

if (!prepareOnly) {
  // log('clearing Jest cache')
  // spawnSync('jest', ['--clearCache'])

  log('running tests')
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  jest.run(['--config', configFile, ...parentArgs])
}
