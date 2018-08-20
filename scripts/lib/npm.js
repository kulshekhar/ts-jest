const spawn = require('cross-spawn')
const { satisfies } = require('semver')
const memoize = require('lodash.memoize')

const version = memoize(() => {
  return spawnSync(['-s', '--version'])
    .stdout.toString()
    .trim()
})

const spawnSync = (args, options = {}) => {
  return spawn.sync('npm', args, options)
}

const can = {
  ci: memoize(() => satisfies(version(), '>=5.7.0')),
  prepare: memoize(() => satisfies(version(), '>=5.7.0')),
}

module.exports = {
  version,
  spawnSync,
  can,
}
