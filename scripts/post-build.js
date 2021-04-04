const { computePackageDigest } = require('./lib/bundle')
const execa = require('execa')
const { generatedPath, rawCompilerOptionsFileName } = require('./lib/paths')

if (execa.sync('git', ['diff-index', '--name-only', 'HEAD']).stdout.includes(rawCompilerOptionsFileName)) {
  throw new Error(
    `Tsconfig options have changed. Please check the modified generated ${generatedPath} and commit the change`
  )
}

computePackageDigest()
