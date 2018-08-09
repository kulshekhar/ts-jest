#!/usr/bin/env node
'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';
const jest = require('jest');
const { sync: spawnSync } = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const Paths = require('./paths');
const { satisfies } = require('semver');
const { createHash } = require('crypto');

const npmVersion = spawnSync('npm', ['-s', '--version'])
  .stdout.toString()
  .trim();
const npmHasCiCommand = satisfies(npmVersion, '>=5.7.0');
const npmHasPrepare = satisfies(npmVersion, '>=4.0.0');

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function sha1(...data) {
  const hash = createHash('sha1');
  data.forEach(item => hash.update(item));
  return hash.digest('base64').toString();
}

function log(...msg) {
  console.log(`[e2e]`, ...msg);
}

function setupE2e() {
  // this will trigger the build as well (not using yarn since yarn pack is bugy)
  // keep on to so that the build is triggered beforehand (pack => prepublish => clean-build => build)
  // Except that on npm < 4.0.0 the prepare doesn't exists
  if (!npmHasPrepare) {
    log('building ts-jest');
    spawnSync('npm', ['-s', 'run', 'build'], { cwd: Paths.rootDir });
  }
  log('creating bundle');
  const res = spawnSync('npm', ['-s', 'pack'], { cwd: Paths.rootDir });
  const bundle = path.join(Paths.rootDir, res.stdout.toString().trim());
  log('bundle create at ', bundle);

  // get the hash of the bundle (to know if we should install it again or not)
  const bundleHash = sha1(fs.readFileSync(bundle));
  log('bundle SHA1: ', bundleHash);

  // ensure directory exists before copying over
  fs.mkdirpSync(Paths.e2eWorkTemplatesDir);

  // create the template packages from which node_modules will be originally copied from
  log('copying templates to the work directory');
  fs.copySync(
    path.join(Paths.e2eTemplatesDir),
    path.join(Paths.e2eWorkTemplatesDir)
  );

  // link locally so we could find it easily
  if (!fs.existsSync(Paths.e2eWotkDirLink)) {
    fs.symlinkSync(Paths.e2eWorkDir, Paths.e2eWotkDirLink, 'dir');
    log(
      'symbolic link to the work directory created at: ',
      Paths.e2eWotkDirLink
    );
  }

  // install with `npm ci` in each template, this is the fastest but needs a package lock file,
  // that is why we end with the npm install of our bundle
  getDirectories(Paths.e2eWorkTemplatesDir).forEach(name => {
    log('checking temlate ', name);
    const dir = path.join(Paths.e2eWorkTemplatesDir, name);
    const nodeModulesDir = path.join(dir, 'node_modules');
    const pkgLockFile = path.join(
      Paths.e2eTemplatesDir,
      name,
      'package-lock.json'
    );
    const e2eFile = path.join(nodeModulesDir, '.ts-jest-e2e.json');

    // no package-lock.json => this template doesn't provide any package-set
    if (!fs.existsSync(pkgLockFile)) {
      log(`  [template: ${name}]`, 'not a package-set template, nothing to do');
      return;
    }

    const pkgLockHash = sha1(fs.readFileSync(pkgLockFile));

    // TODO: create a hash of package-lock.json as well as the bundle, and test it over one copied in each
    // template dir, to know if we should re-install or not
    const e2eData = fs.existsSync(e2eFile) ? fs.readJsonSync(e2eFile) : {};
    let bundleOk = e2eData.bundleHash === bundleHash;
    let packagesOk = e2eData.packageLockHash === pkgLockHash;

    if (fs.existsSync(nodeModulesDir)) {
      log(`  [template: ${name}]`, 'manifest: ', JSON.stringify(e2eData));
      log(`  [template: ${name}]`, 'bundle: ', bundleOk ? 'HIT' : 'MISS');
      log(`  [template: ${name}]`, 'packages: ', packagesOk ? 'HIT' : 'MISS');
      if (bundleOk && packagesOk) {
        log(
          `  [template: ${name}]`,
          'bundle and packages unchanged, nothing to do'
        );
        return;
      }
    }

    if (!packagesOk) {
      if (npmHasCiCommand) {
        log(`  [template: ${name}]`, 'installing packages using "npm ci"');
        spawnSync('npm', ['ci'], { cwd: dir });
      } else {
        log(`  [template: ${name}]`, 'installing packages using "npm install"');
        spawnSync('npm', ['i'], { cwd: dir });
      }
      bundleOk = false;
    }
    if (!bundleOk) {
      log(`  [template: ${name}]`, 'installing bundle');
      spawnSync('npm', ['i', '-D', bundle], { cwd: dir });
    }

    // write our data
    e2eData.bundleHash = bundleHash;
    e2eData.packageLockHash = pkgLockHash;
    log(`  [template: ${name}]`, 'writing manifest: ', JSON.stringify(e2eData));
    fs.outputJsonSync(e2eFile, e2eData, { space: 2 });
  });
}

setupE2e();

log('templates are ready, running tests', '\n\n');
const argv = process.argv.slice(2);
jest.run(argv);
