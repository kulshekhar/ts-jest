const { computePackageDigest } = require('./lib/bundle')
const execa = require('execa')
const { generatedPath, rawCompilerOptionsFileName } = require('./lib/paths')

try {
  execa.sync('git', ['--version'])
  if (execa.sync('git', ['diff-index', '--name-only', 'HEAD']).stdout.includes(rawCompilerOptionsFileName)) {
    throw new Error(
      `Tsconfig options have changed. Please check the modified generated ${generatedPath} and commit the change`
    )
  }
} catch (e) {
  console.log('git command is not available. Skip checking generated types')
}
computePackageDigest()
