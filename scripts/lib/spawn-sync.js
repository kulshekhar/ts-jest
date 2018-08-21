const { sync } = require('cross-spawn')

/**
 * @type {typeof sync}
 */
const spawnSync = (...args) => {
  const res = sync(...args)
  if (res.error) {
    throw res.error
  }
  if (res.status !== 0) {
    throw new Error(res.stderr.toString('utf8'))
  }
  return res
}

module.exports = {
  spawnSync,
}
