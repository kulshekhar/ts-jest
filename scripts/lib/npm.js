const { spawnSync: spawn } = require('./spawn-sync')
const { satisfies } = require('semver')
const memoize = require('lodash.memoize')
const { join } = require('path')

const version = memoize(() =>
  spawnSync(['-s', '--version'])
    .stdout.toString()
    .trim()
)

const spawnSync = (args, options = {}) => spawn('npm', args, options)

const can = {
  ci: memoize(() => satisfies(version(), '>=5.7.0')),
  prepare: memoize(() => satisfies(version(), '>=5.7.0')),
}

function directDepsPkg(dir) {
  const main = require(join(dir, 'package.json'))
  const res = {}
  Object.keys(main.dependencies || {}).forEach(
    key => (res[key] = require(join(dir, 'node_modules', key, 'package.json')))
  )
  Object.keys(main.devDependencies || {}).forEach(key => {
    if (res[key]) return
    res[key] = require(join(dir, 'node_modules', key, 'package.json'))
  })
  return res
}

module.exports = {
  version,
  spawnSync,
  can,
  directDepsPkg,
}
