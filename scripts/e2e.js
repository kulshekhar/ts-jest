#!/usr/bin/env node
'use strict';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';
const jest = require('jest');
const { sync: spawnSync } = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const Paths = require('./paths');

const NodeVersion = (versions => {
  return { major: versions[0], minor: versions[1], patch: versions[2] };
})(
  process.versions.node
    .split('-')
    .shift()
    .split('.')
    .map(s => parseInt(s, 10))
);

function getDirectories(rootDir) {
  return fs.readdirSync(rootDir).filter(function(file) {
    return fs.statSync(path.join(rootDir, file)).isDirectory();
  });
}

function setupE2e() {
  // this will trigger the build as well (not using yarn since yarn pack is bugy)
  // keep on to so that the build is triggered beforehand (pack => prepublish => clean-build => build)
  const res = spawnSync('npm', ['-s', 'pack'], { cwd: Paths.rootDir });
  const bundle = path.join(Paths.rootDir, res.stdout.toString().trim());

  // ensure directory exists before copying over
  fs.mkdirpSync(Paths.e2eWorkTemplatesDir);

  // create the template packages from which node_modules will be originally copied from
  fs.copySync(
    path.join(Paths.e2eTemplatesDir),
    path.join(Paths.e2eWorkTemplatesDir)
  );

  // link locally so we could find it easily
  fs.symlinkSync(Paths.e2eWorkDir, Paths.e2eWotkDirLink);

  // install with `npm ci` in each template, this is the fastest but needs a package lock file,
  // that is why we end with the npm install of our bundle
  getDirectories(Paths.e2eWorkTemplatesDir).forEach(tmplDir => {
    const dir = path.join(Paths.e2eWorkTemplatesDir, tmplDir);
    if (NodeVersion.major >= 8) {
      spawnSync('npm', ['ci'], { cwd: dir, stdio: 'inherit' });
    } else {
      // npm coming with node < 8 does not have the `ci` command
      spawnSync('npm', ['i'], { cwd: dir, stdio: 'inherit' });
    }
    spawnSync('npm', ['i', '-D', bundle], { cwd: dir, stdio: 'inherit' });
  });
}

setupE2e();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--config', path.join(Paths.rootDir, 'jest.config.e2e.js'));
jest.run(argv);
