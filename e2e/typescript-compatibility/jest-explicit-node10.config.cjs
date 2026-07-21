const path = require('node:path')

const config = require('./jest-config.cjs')({ esm: false, isolatedModules: true })
config.testMatch = ['<rootDir>/__tests__/compat.spec.ts']
config.transform['^.+\\.ts$'][1].tsconfig = path.join(__dirname, 'tsconfig-cjs-explicit-node10.json')

module.exports = config
