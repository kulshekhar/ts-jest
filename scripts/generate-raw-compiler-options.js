const fs = require('fs')

const { compile } = require('json-schema-to-typescript')
const fetch = require('node-fetch')

const { generatedPath } = require('./lib/paths')

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const generateRawTsCompilerOptions = async () => {
  const response = await fetch('https://json.schemastore.org/tsconfig')
  const tsconfigSchema = await response.json()

  return compile(
    {
      title: 'RawCompilerOptions',
      type: 'object',
      properties: tsconfigSchema.definitions.compilerOptionsDefinition.properties,
      additionalProperties: false,
    },
    'generated-raw-compiler-options'
  )
}

void generateRawTsCompilerOptions().then((rawCompilerOptions) => {
  fs.writeFileSync(generatedPath, rawCompilerOptions)
})

module.exports = {
  generateRawTsCompilerOptions,
}
