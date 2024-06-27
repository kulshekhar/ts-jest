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
import { JEST_CONFIG_EJS_TEMPLATE } from '../../constants'
import {
  createLegacyDefaultPreset,
  createLegacyJsWithTsPreset,
  createLegacyWithBabelPreset,
} from '../../presets/create-jest-preset'
import type { DefaultPreset, JsWithBabelPreset, JsWithTsPreset, TsJestTransformerOptions } from '../../types'

const ensureOnlyUsingDoubleQuotes = (str: string): string => {
  return str
    .replace(/"'(.*?)'"/g, '"$1"')
    .replace(/'ts-jest'/g, '"ts-jest"')
    .replace(/'babel-jest'/g, '"babel-jest"')
}

/**
 * @internal
 */
export const run: CliCommand = async (args: CliCommandArgs /* , logger: Logger */) => {
  const { tsconfig: askedTsconfig, force, jsdom, js: jsFilesProcessor, babel: shouldPostProcessWithBabel } = args
  const file = args._[0]?.toString() ?? 'jest.config.js'
  const filePath = join(process.cwd(), file)
  const name = basename(file)
  const isPackageJsonConfig = name === 'package.json'
  const isJestConfigFileExisted = existsSync(filePath)
  const pkgFile = isPackageJsonConfig ? filePath : join(process.cwd(), 'package.json')
  const isPackageJsonExisted = isPackageJsonConfig || existsSync(pkgFile)
  const tsconfig =
    askedTsconfig === 'tsconfig.json' ? undefined : (askedTsconfig as TsJestTransformerOptions['tsconfig'])
  const pkgJsonContent = isPackageJsonExisted ? JSON.parse(readFileSync(pkgFile, 'utf8')) : {}

  if (isPackageJsonConfig && !isJestConfigFileExisted) {
    throw new Error(`File ${file} does not exists.`)
  } else if (!isPackageJsonConfig && isJestConfigFileExisted && !force) {
    throw new Error(`Configuration file ${file} already exists.`)
  }
  if (!isPackageJsonConfig && !name.endsWith('.js')) {
    throw new TypeError(`Configuration file ${file} must be a .js file or the package.json.`)
  }
  if (isPackageJsonExisted && pkgJsonContent.jest) {
    if (force && !isPackageJsonConfig) {
      delete pkgJsonContent.jest
      writeFileSync(pkgFile, JSON.stringify(pkgJsonContent, undefined, '  '))
    } else if (!force) {
      throw new Error(`A Jest configuration is already set in ${pkgFile}.`)
    }
  }

  let body: string
  const resolvedTsconfigOption = tsconfig ? { tsconfig: `${stringifyJson5(tsconfig)}` } : undefined
  let transformConfig: DefaultPreset | JsWithTsPreset | JsWithBabelPreset
  if (jsFilesProcessor === 'babel' || shouldPostProcessWithBabel) {
    transformConfig = createLegacyWithBabelPreset(resolvedTsconfigOption)
  } else if (jsFilesProcessor === 'ts') {
    transformConfig = createLegacyJsWithTsPreset(resolvedTsconfigOption)
  } else {
    transformConfig = createLegacyDefaultPreset(resolvedTsconfigOption)
  }
  if (isPackageJsonConfig) {
    body = ensureOnlyUsingDoubleQuotes(
      JSON.stringify(
        {
          ...pkgJsonContent,
          jest: transformConfig,
        },
        undefined,
        '  ',
      ),
    )
  } else {
    const [transformPattern, transformValue] = Object.entries(transformConfig.transform)[0]
    body = ejs.render(JEST_CONFIG_EJS_TEMPLATE, {
      exportKind: pkgJsonContent.type === 'module' ? 'export default' : 'module.exports =',
      testEnvironment: jsdom ? 'jsdom' : 'node',
      transformPattern,
      transformValue: ensureOnlyUsingDoubleQuotes(stringifyJson5(transformValue)),
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
  --no-jest-preset      Disable the use of Jest presets
  --tsconfig <file>     Path to the tsconfig.json file
  --babel               Enable using Babel to process 'js' resulted content from 'ts-jest' processing
  --jsdom               Use 'jsdom' as test environment instead of 'node'
`)
}
