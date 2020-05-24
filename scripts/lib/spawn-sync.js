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
    const msgs = []
    if (res && res.stderr) msgs.push(res.stderr.toString('utf8').trim())
    if (res && res.stdout) msgs.push(res.stdout.toString('utf8').trim())
    msgs.push('unknown error')
    throw new Error(msgs.find((s) => s))
  }

  return res
}

module.exports = {
  spawnSync,
}
