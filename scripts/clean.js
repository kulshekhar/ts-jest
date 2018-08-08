#!/usr/bin/env node

const { removeSync } = require('fs-extra');
const Paths = require('./paths');
const { join } = require('path');

removeSync(Paths.distDir);
removeSync(join(Paths.testsRootDir, '*', 'coverage'));
removeSync(join(Paths.testsRootDir, '*', 'debug.txt'));
removeSync(join(Paths.testsRootDir, '*', 'node_modules'));
removeSync(join(Paths.e2eSourceDir, '*', 'node_modules'));
removeSync(join(Paths.e2eTemplatesDir, '*', 'node_modules'));
removeSync(Paths.e2eWorkDir);
removeSync(Paths.e2eWotkDirLink);
