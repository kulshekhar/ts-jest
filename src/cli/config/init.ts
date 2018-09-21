/**
 * This has been written quickly. While trying to improve I realised it'd be better to have it in Jest...
 * ...and I saw a merged PR with `jest --init` tool!
 * TODO: see what's the best path for this
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { stringify as stringifyJson5 } from 'json5'
import { basename, join } from 'path'
import { Arguments } from 'yargs'

import { CliCommand } from '..'
import { createJestPreset } from '../../config/create-jest-preset'

/**
 * @internal
 */
export const run: CliCommand = async (args: Arguments /* , logger: Logger */) => {
  const file = args._[0] || 'jest.config.js'
  const filePath = join(process.cwd(), file)
  const name = basename(file)
  const isPackage = name === 'package.json'
  const exists = existsSync(filePath)
  const pkgFile = isPackage ? filePath : join(process.cwd(), 'package.json')
  const hasPackage = isPackage || existsSync(pkgFile)
  // read config
  const { allowJs = false, jestPreset = true, tsconfig: askedTsconfig, babel = false, force, jsdom } = args
  const tsconfig = askedTsconfig === 'tsconfig.json' ? undefined : askedTsconfig
  const hasPresetVar = allowJs || !jestPreset
  // read package
  const pkgJson = hasPackage ? JSON.parse(readFileSync(pkgFile, 'utf8')) : {}

  if (isPackage && !exists) {
    throw new Error(`File ${file} does not exists.`)
  } else if (!isPackage && exists && !force) {
    throw new Error(`Configuration file ${file} already exists.`)
  }
  if (!isPackage && !name.endsWith('.js')) {
    throw new TypeError(`Configuration file ${file} must be a .js file or the package.json.`)
  }
  if (hasPackage && pkgJson.jest) {
    if (force && !isPackage) {
      delete pkgJson.jest
      writeFileSync(pkgFile, JSON.stringify(pkgJson, undefined, '  '))
    } else if (!force) {
      throw new Error(`A Jest configuration is already set in ${pkgFile}.`)
    }
  }

  // build configuration
  let body: string

  if (isPackage) {
    // package.json config
    const base: any = hasPresetVar ? createJestPreset({ allowJs }) : { preset: 'ts-jest' }
    if (!jsdom) base.testEnvironment = 'node'
    if (tsconfig || babel) {
      const tsJestConf: any = {}
      base.globals = { 'ts-jest': tsJestConf }
      if (tsconfig) tsJestConf.tsconfig = tsconfig
      if (babel) tsJestConf.babelConfig = true
    }
    body = JSON.stringify({ ...pkgJson, jest: base }, undefined, '  ')
  } else {
    // js config
    const content = []
    if (hasPresetVar) {
      content.push(`const tsJest = require('ts-jest').createJestPreset({ allowJs: ${allowJs} });`, '')
    }
    content.push('module.exports = {')
    if (hasPresetVar) {
      content.push(`  ...tsJest,`)
    } else {
      content.push(`  preset: 'ts-jest',`)
    }
    if (!jsdom) content.push(`  testEnvironment: 'node',`)

    if (tsconfig || babel) {
      content.push(`  globals: {`)
      content.push(`    'ts-jest': {`)
      if (tsconfig) content.push(`      tsconfig: ${stringifyJson5(tsconfig)},`)
      if (babel) content.push(`      babelConfig: true,`)
      content.push(`    },`)
      content.push(`  },`)
    }

    content.push('};')

    // join all together
    body = content.join('\n')
  }

  writeFileSync(filePath, body)

  process.stderr.write(`
Jest configuration written to "${filePath}".
`)
}

/**
 * @internal
 */
export const help: CliCommand = async () => {
  process.stdout.write(`
Usage:
  ts-jest config:init [options] [<config-file>]

Arguments:
  <config-file>         Can be a js or json Jest config file. If it is a
                        package.json file, the configuration will be read from
                        the "jest" property.
                        Default: jest.config.js

Options:
  --force               Discard any existing Jest config
  --allow-js            ts-jest will be used to process JS files as well
  --no-jest-preset      Disable the use of Jest presets
  --tsconfig <file>     Path to the tsconfig.json file
  --babel               Call BabelJest after ts-jest
  --jsdom               Use jsdom as test environment instead of node
`)
}
