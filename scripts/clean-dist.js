#!/usr/bin/env node

const { removeSync } = require('fs-extra')
const Paths = require('./lib/paths')

removeSync(Paths.distDir)
