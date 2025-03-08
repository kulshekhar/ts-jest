const fs = require('fs')

const execa = require('execa')
const { compile } = require('json-schema-to-typescript')

const { generatedPath, rawCompilerOptionsFileName } = require('./lib/paths')

const generateRawTsCompilerOptions = async () => {
  const response = await fetch('https://json.schemastore.org/tsconfig')
  const tsconfigSchema = await response.json()
  const resultString = await compile(
    {
      title: 'RawCompilerOptions',
      type: 'object',
      properties: tsconfigSchema.definitions.compilerOptionsDefinition.properties,
      additionalProperties: false,
    },
    'raw-compiler-options'
  )

  return (
    resultString
      .substring(resultString.indexOf('compilerOptions?:'), resultString.lastIndexOf('}'))
      .replace('compilerOptions?:', 'export interface RawCompilerOptions')
      // Allow to specify string value like `module: 'amd'` besides valid value `module: 'AMD'`
      .replace(/&\n {6}string/g, '| string')
      // Remove invalid type `[k: string]: unknown`
      .replace(/\| {\n {10}\[k: string]: unknown;\n {8}}/g, '')
  )
}

void generateRawTsCompilerOptions().then((resultString) => {
  fs.writeFileSync(generatedPath, resultString)
  execa.sync('eslint', [rawCompilerOptionsFileName, '--fix'])
})

module.exports = {
  generateRawTsCompilerOptions,
}
