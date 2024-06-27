/**
 * This has been written quickly. While trying to improve I realised it'd be better to have it in Jest...
 * ...and I saw a merged PR with `jest --init` tool!
 * TODO: see what's the best path for this
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'

import ejs from 'ejs'
import { stringify as stringifyJson5 } from 'json5'

import type { CliCommand, CliCommandArgs } from '..'
import { JEST_CONFIG_EJS_TEMPLATE, TS_JS_TRANSFORM_PATTERN, TS_TRANSFORM_PATTERN } from '../../constants'
import type { JestConfigWithTsJest, TsJestTransformerOptions } from '../../types'
import { type TsJestPresetDescriptor, defaults, jsWIthBabel, jsWithTs, JestPresetNames } from '../helpers/presets'

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
    let transformPattern = TS_TRANSFORM_PATTERN
    let transformValue = !tsconfig
      ? `'ts-jest'`
      : `
        [
          'ts-jest',
          {
            tsconfig: ${stringifyJson5(tsconfig)}
          }
        ]
      `
    if (preset.name === JestPresetNames.jsWithTs) {
      transformPattern = TS_JS_TRANSFORM_PATTERN
    } else if (preset.name === JestPresetNames.jsWIthBabel) {
      transformValue = !tsconfig
        ? `'ts-jest'`
        : `
        [
          'ts-jest',
          {
            babelConfig: true,
            tsconfig: ${stringifyJson5(tsconfig)}
          }
        ]
      `
    }
    body = ejs.render(JEST_CONFIG_EJS_TEMPLATE, {
      exportKind: pkgJson.type === 'module' ? 'export default' : 'module.exports =',
      testEnvironment: jsdom ? 'jsdom' : 'node',
      transformPattern,
      transformValue,
    })
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
  --js ts|babel         Process '.js' files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --jest-preset         Toggle using preset
  --tsconfig <file>     Path to the tsconfig.json file
  --babel               Enable using Babel to process 'js' resulted content from 'ts-jest' processing
  --jsdom               Use 'jsdom' as test environment instead of 'node'
`)
}
