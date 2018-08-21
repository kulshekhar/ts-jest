#!/usr/bin/env node
'use strict'

const jest = require('jest')
const { sync: spawnSync } = require('cross-spawn')
const fs = require('fs-extra')
const path = require('path')
const Paths = require('./lib/paths')
const { createHash } = require('crypto')
const logger = require('./lib/logger')
const { createBundle, packageDigest } = require('./lib/bundle')
const npm = require('./lib/npm')

const configFile = path.join(Paths.e2eRootDir, 'jest.config.js')

let parentArgs = process.argv.slice(2)
if (parentArgs.includes('--coverage')) {
  logger.warn(
    'Coverages cannot be activated for e2e tests (but can in each e2e test).'
  )
  parentArgs = parentArgs.filter(a => a !== '--coverage')
}

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory()
  })
}

function sha1(...data) {
  const hash = createHash('sha1')
  data.forEach(item => hash.update(item))
  return hash.digest('hex').toString()
}

function log(...msg) {
  logger.log('[e2e]', ...msg)
}

function setupE2e() {
  // kept on top so that the build is triggered beforehand (pack => prepublish => clean-build => build)
  const bundle = createBundle(log)
  log(
    'bundle created:',
    path.relative(Paths.rootDir, bundle),
    '; computing digest'
  )

  // get the hash of the bundle (to know if we should install it again or not)
  // we need to compute it ourselfs as the npm pack creates different tgz even tho content has not changed
  const bundleHash = packageDigest(bundle)
  log('ts-jest digest:', bundleHash)

  // ensure directory exists before copying over
  fs.mkdirpSync(Paths.e2eWorkTemplatesDir)

  // link locally so we could find it easily
  if (!process.env.CI && !fs.existsSync(Paths.e2eWotkDirLink)) {
    fs.symlinkSync(Paths.e2eWorkDir, Paths.e2eWotkDirLink, 'dir')
    log(
      'symbolic link to the work directory created at: ',
      Paths.e2eWotkDirLink
    )
  }

  // install with `npm ci` in each template, this is the fastest but needs a package lock file,
  // that is why we end with the npm install of our bundle
  getDirectories(Paths.e2eTemplatesDir).forEach(name => {
    log('checking template ', name)
    const sourceDir = path.join(Paths.e2eTemplatesDir, name)
    const dir = path.join(Paths.e2eWorkTemplatesDir, name)
    const nodeModulesDir = path.join(dir, 'node_modules')
    const pkgLockFile = path.join(sourceDir, 'package-lock.json')
    const e2eFile = path.join(nodeModulesDir, '.ts-jest-e2e.json')

    // remove all files expect node_modules
    if (fs.existsSync(dir)) {
      log(`  [template: ${name}]`, 'removing old files')
      fs.readdirSync(dir).forEach(file => {
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

    // TODO: create a hash of package-lock.json as well as the bundle, and test it over one copied in each
    // template dir, to know if we should re-install or not
    const e2eData = fs.existsSync(e2eFile) ? fs.readJsonSync(e2eFile) : {}
    let bundleOk = e2eData.bundleHash === bundleHash
    let packagesOk = e2eData.packageLockHash === pkgLockHash

    if (fs.existsSync(nodeModulesDir)) {
      log(`  [template: ${name}]`, 'bundle: ', bundleOk ? 'OK' : 'CHANGED')
      log(`  [template: ${name}]`, 'packages: ', packagesOk ? 'OK' : 'CHANGED')
      if (bundleOk && packagesOk) {
        log(
          `  [template: ${name}]`,
          'bundle and packages unchanged, nothing to do'
        )
        return
      }
    }

    if (!packagesOk) {
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

    // write our data
    e2eData.bundleHash = bundleHash
    e2eData.packageLockHash = pkgLockHash
    log(`  [template: ${name}]`, 'writing manifest')
    fs.outputJsonSync(e2eFile, e2eData, { space: 2 })
  })
}

// ============================================================================

setupE2e()

log('templates are ready, clearing Jest cache')

spawnSync('jest', ['--clearCache'])

log('running tests')

jest.run(['--config', configFile, ...parentArgs])
