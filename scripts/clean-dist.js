#!/usr/bin/env node

const { removeSync } = require('fs-extra');
const Paths = require('./paths');

removeSync(Paths.distDir);
