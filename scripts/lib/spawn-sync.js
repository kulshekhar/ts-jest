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
    let msg = 'unknown error'
    try {
      msg =
        res.stderr.toString('utf8').trim() ||
        res.stdout.toString('utf8').trim() ||
        msg
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
