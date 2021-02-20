const fs = require('fs')

const { generateRawTsCompilerOptions } = require('./generate-raw-compiler-options')
const { computePackageDigest } = require('./lib/bundle')
const { generatedPath } = require('./lib/paths')

void (async () => {
  const rawCompilerOptions = await generateRawTsCompilerOptions()
  if (rawCompilerOptions !== fs.readFileSync(generatedPath, 'utf-8')) {
    throw new Error('Tsconfig options have changed. The generated file should be regenerated')
  }
})()

computePackageDigest()
