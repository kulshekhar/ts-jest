const { compile } = require('json-schema-to-typescript')
const fs = require('fs')
const fetch = require('node-fetch')
const path = require('path')

void (async () => {
  const response = await fetch('https://json.schemastore.org/tsconfig')
  const tsconfigSchema = await response.json()
  const rawTsconfig = await compile(tsconfigSchema)
  fs.writeFileSync(path.join(process.cwd(), 'src', 'tsconfig-raw-types.d.ts'), rawTsconfig)
})()
