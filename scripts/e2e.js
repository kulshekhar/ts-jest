#!/usr/bin/env node
'use strict';

process.env.NODE_ENV = 'test';
const jest = require('jest');
const { sync: spawnSync } = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const Paths = require('./paths');

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
  fs.mkdirpSync(Paths.e2eWorkTemplateDir);

  // create the tempalte package from which node_modules will be originally copied from
  fs.copySync(
    path.join(Paths.e2eSourceDir, 'package-template.json'),
    path.join(Paths.e2eWorkTemplateDir, 'package.json')
  );
  // link locally so we could find it easily
  fs.symlinkSync(Paths.e2eWorkDir, Paths.e2eWotkDirLink);
  // TODO: run with specific versions?
  spawnSync('npm', ['i', '-D', 'jest', 'typescript', bundle], {
    cwd: Paths.e2eWorkTemplateDir,
    stdio: 'inherit',
  });

  // copy into our temp sub-folder
  getDirectories(Paths.e2eSourceDir).forEach(directory => {
    // copy source and test files
    fs.copySync(
      path.join(Paths.e2eSourceDir, directory),
      path.join(Paths.e2eWorkDir, directory)
    );
    // create the node_modules dir
    const caseNodeModulesDir = path.join(
      Paths.e2eWorkDir,
      directory,
      'node_modules'
    );
    fs.mkdirpSync(caseNodeModulesDir);
    // link each node_modules from tempalte dir (so that we can install some more specific in each package later)
    const tmplNodeModulesDir = path.join(
      Paths.e2eWorkTemplateDir,
      'node_modules'
    );
    getDirectories(tmplNodeModulesDir).forEach(moduleDir => {
      // avoid linking '.bin'
      if (moduleDir === '.bin') return;
      fs.symlinkSync(
        path.join(tmplNodeModulesDir, moduleDir),
        path.join(caseNodeModulesDir, moduleDir)
      );
    });
  });
}

setupE2e();

const argv = process.argv.slice(2);
argv.push('--no-cache');
argv.push('--config', path.join(Paths.rootDir, 'jest.config.e2e.js'));
jest.run(argv);
