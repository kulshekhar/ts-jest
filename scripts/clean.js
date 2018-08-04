#!/usr/bin/env node

const rimraf = require('rimraf');
const Paths = require('./paths');
const { join } = require('path');

rimraf.sync(Paths.distDir);
rimraf.sync(join(Paths.testsRootDir, '*', 'coverage'));
rimraf.sync(join(Paths.testsRootDir, '*', 'debug.txt'));
rimraf.sync(join(Paths.testsRootDir, '*', 'node_modules'));
rimraf.sync(join(Paths.e2eSourceDir, '*', 'node_modules'));
rimraf.sync(join(Paths.e2eTemplatesDir, '*', 'node_modules'));
rimraf.sync(Paths.e2eWorkDir);
rimraf.sync(Paths.e2eWotkDirLink);
