const { join } = require('path')

function directDepsPkg(dir) {
  const main = require(join(dir, 'package.json'))
  const res = {}
  Object.keys(main.dependencies || {}).forEach(
    (key) => (res[key] = require(join(dir, 'node_modules', key, 'package.json')))
  )
  Object.keys(main.devDependencies || {}).forEach((key) => {
    if (res[key]) return
    res[key] = require(join(dir, 'node_modules', key, 'package.json'))
  })

  return res
}

module.exports = {
  directDepsPkg,
}
