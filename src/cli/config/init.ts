/**
 * This has been written quickly. While trying to improve I realised it'd be better to have it in Jest...
 * ...and I saw a merged PR with `jest --init` tool!
 * TODO: see what's the best path for this
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'

import { stringify as stringifyJson5 } from 'json5'

import type { CliCommand, CliCommandArgs } from '..'
import type { JestConfigWithTsJest, TsJestTransformerOptions } from '../../types'
import { type TsJestPresetDescriptor, defaults, jsWIthBabel, jsWithTs } from '../helpers/presets'

/**
 * @internal
 */
export const run: CliCommand = async (args: CliCommandArgs /* , logger: Logger */) => {
  const file = args._[0]?.toString() ?? 'jest.config.js'
  const filePath = join(process.cwd(), file)
  const name = basename(file)
  const isPackage = name === 'package.json'
  const exists = existsSync(filePath)
  const pkgFile = isPackage ? filePath : join(process.cwd(), 'package.json')
  const hasPackage = isPackage || existsSync(pkgFile)
  // read config
  const { jestPreset = true, tsconfig: askedTsconfig, force, jsdom } = args
  const tsconfig =
    askedTsconfig === 'tsconfig.json' ? undefined : (askedTsconfig as TsJestTransformerOptions['tsconfig'])
  // read package
  const pkgJson = hasPackage ? JSON.parse(readFileSync(pkgFile, 'utf8')) : {}

  // auto js/babel
  let { js: jsFilesProcessor, babel: shouldPostProcessWithBabel } = args
  // set defaults for missing options
  if (jsFilesProcessor == null) {
    // set default js files processor depending on whether the user wants to post-process with babel
    jsFilesProcessor = shouldPostProcessWithBabel ? 'babel' : undefined
  } else if (shouldPostProcessWithBabel == null) {
    // auto enables babel post-processing if the user wants babel to process js files
    shouldPostProcessWithBabel = jsFilesProcessor === 'babel'
  }

  // preset
  let preset: TsJestPresetDescriptor | undefined
  if (jsFilesProcessor === 'babel') {
    preset = jsWIthBabel
  } else if (jsFilesProcessor === 'ts') {
    preset = jsWithTs
  } else {
    preset = defaults
  }

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
    const jestConfig: JestConfigWithTsJest = jestPreset ? { preset: preset.name } : { ...preset.value }
    if (!jsdom) jestConfig.testEnvironment = 'node'
    const transformerConfig = Object.entries(jestConfig.transform ?? {}).reduce(
      (acc, [fileRegex, transformerConfig]) => {
        if (tsconfig || shouldPostProcessWithBabel) {
          const tsJestConf: TsJestTransformerOptions = {}
          if (tsconfig) tsJestConf.tsconfig = tsconfig
          if (shouldPostProcessWithBabel) tsJestConf.babelConfig = true

          return {
            ...acc,
            [fileRegex]:
              typeof transformerConfig === 'string'
                ? [transformerConfig, tsJestConf]
                : [transformerConfig[0], { ...transformerConfig[1], ...tsJestConf }],
          }
        }

        return {
          ...acc,
          [fileRegex]: transformerConfig,
        }
      },
      {},
    )
    if (Object.keys(transformerConfig).length) {
      jestConfig.transform = {
        ...jestConfig.transform,
        ...transformerConfig,
      }
    }
    body = JSON.stringify({ ...pkgJson, jest: jestConfig }, undefined, '  ')
  } else {
    // js config
    const content: string[] = []
    if (!jestPreset) {
      content.push(`${preset.jsImport('tsjPreset')};`, '')
    }
    content.push(`/** @type {import('ts-jest').JestConfigWithTsJest} */`)
    const usesModules = pkgJson.type === 'module'
    content.push(usesModules ? 'export default {' : 'module.exports = {')

    if (jestPreset) {
      content.push(`  preset: '${preset.name}',`)
    } else {
      content.push('  ...tsjPreset,')
    }
    if (!jsdom) content.push("  testEnvironment: 'node',")

    if (tsconfig || shouldPostProcessWithBabel) {
      content.push('  transform: {')
      content.push("    '^.+\\\\.[tj]sx?$': ['ts-jest', {")
      if (tsconfig) content.push(`      tsconfig: ${stringifyJson5(tsconfig)},`)
      if (shouldPostProcessWithBabel) content.push('      babelConfig: true,')
      content.push('    }],')
      content.push('  },')
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
  --js ts|babel         Process .js files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --no-jest-preset      Disable the use of Jest presets
  --tsconfig <file>     Path to the tsconfig.json file
  --babel               Pipe babel-jest after ts-jest
  --jsdom               Use jsdom as test environment instead of node
`)
}
