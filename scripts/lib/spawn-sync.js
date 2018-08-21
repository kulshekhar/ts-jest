const { spawnSync: sync } = require('child_process')

/**
 * @type {typeof sync}
 */
const spawnSync = (...args) => {
  const res = sync(...args)
  if (res.error) {
    throw res.error
  }
  if (res.status !== 0) {
    let msg = 'unknown error'
    try {
      msg = res.stderr.toString('utf8')
    } catch (err) {
      null
    }
    throw new Error(msg)
  }
  return res
}

module.exports = {
  spawnSync,
}
