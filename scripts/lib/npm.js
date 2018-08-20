const { sync: spawnSync } = require('cross-spawn')
const { satisfies } = require('semver')
const memoize = require('lodash.memoize')

const self = {}

Object.defineProperties(self, {
  version: {
    get: memoize(() =>
      self
        .spawnSync(['-s', '--version'])
        .stdout.toString()
        .trim(),
    ),
  },
  spawnSync: {
    value(args, options = {}) {
      return spawnSync('npm', args, options)
    },
  },
  can: {
    value: Object.defineProperties(
      {},
      {
        ci: { get: memoize(() => satisfies(self.version, '>=5.7.0')) },
        prepare: { get: memoize(() => satisfies(self.version, '>=5.7.0')) },
      },
    ),
  },
})

module.exports = self
