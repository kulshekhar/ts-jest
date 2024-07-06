import { existsSync } from 'fs'
import { basename, resolve } from 'path'

import type { Config } from '@jest/types'
import { createLogger } from 'bs-logger'
import stableStringify from 'fast-json-stable-stringify'
import { stringify as stringifyJson5 } from 'json5'

import type { CliCommand, CliCommandArgs } from '..'
import { createDefaultPreset, createJsWithBabelPreset, createJsWithTsPreset } from '../../presets/create-jest-preset'
import type { TsJestTransformerOptions } from '../../types'
import { backportJestConfig } from '../../utils/backports'
import { JestPresetNames, type TsJestPresetDescriptor, allPresets } from '../helpers/presets'

const migrateGlobalConfigToTransformConfig = (
  transformConfig: Config.InitialOptions['transform'],
  globalsTsJestConfig: TsJestTransformerOptions | undefined,
) => {
  if (transformConfig) {
    return Object.entries(transformConfig).reduce((previousValue, currentValue) => {
      const [key, transformOptions] = currentValue
      if (typeof transformOptions === 'string' && transformOptions.includes('ts-jest')) {
        return {
          ...previousValue,
          [key]: globalsTsJestConfig ? ['ts-jest', globalsTsJestConfig] : 'ts-jest',
        }
      }

      return {
        ...previousValue,
        [key]: transformOptions,
      }
    }, {})
  }

  return {}
}

const migratePresetToTransformConfig = (
  transformConfig: Config.InitialOptions['transform'],
  preset: TsJestPresetDescriptor | undefined,
  globalsTsJestConfig: TsJestTransformerOptions | undefined,
) => {
  if (preset) {
    const transformConfigFromPreset =
      preset.name === JestPresetNames.jsWithTs
        ? createJsWithTsPreset(globalsTsJestConfig)
        : preset.name === JestPresetNames.jsWIthBabel
        ? createJsWithBabelPreset(globalsTsJestConfig)
        : createDefaultPreset(globalsTsJestConfig)

    return {
      ...transformConfig,
      ...transformConfigFromPreset.transform,
    }
  }

  return transformConfig
}

/**
 * @internal
 */
export const run: CliCommand = async (args: CliCommandArgs /* , logger: Logger*/) => {
  const nullLogger = createLogger({ targets: [] })
  const file = args._[0]?.toString()
  const filePath = resolve(process.cwd(), file)
  if (!existsSync(filePath)) {
    throw new Error(`Configuration file ${file} does not exists.`)
  }
  const name = basename(file)
  const isPackage = name === 'package.json'
  if (!/\.(js|json)$/.test(name)) {
    throw new TypeError(`Configuration file ${file} must be a JavaScript or JSON file.`)
  }
  let actualConfig: Config.InitialOptions = require(filePath)
  if (isPackage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actualConfig = (actualConfig as any).jest
  }
  if (!actualConfig) actualConfig = {}

  // migrate
  // first we backport our options
  const migratedConfig = backportJestConfig(nullLogger, actualConfig)
  let preset: TsJestPresetDescriptor | undefined
  if (migratedConfig.preset) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preset = (allPresets as any)[migratedConfig.preset] ?? allPresets[JestPresetNames.default]
  } else {
    if (args.js) {
      preset = args.js === 'babel' ? allPresets[JestPresetNames.jsWIthBabel] : allPresets[JestPresetNames.jsWithTs]
    } else {
      preset = allPresets[JestPresetNames.default]
    }
  }

  // check the extensions
  if (migratedConfig.moduleFileExtensions?.length && preset) {
    const presetValue = dedupSort(preset.value.moduleFileExtensions ?? []).join('::')
    const migratedValue = dedupSort(migratedConfig.moduleFileExtensions).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.moduleFileExtensions
    }
  }
  // there is a testRegex, remove our testMatch
  if (typeof migratedConfig.testRegex === 'string' || migratedConfig.testRegex?.length) {
    delete migratedConfig.testMatch
  }
  // check the testMatch
  else if (migratedConfig.testMatch?.length && preset) {
    const presetValue = dedupSort(preset.value.testMatch ?? []).join('::')
    const migratedValue = dedupSort(migratedConfig.testMatch).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.testMatch
    }
  }

  const globalsTsJestConfig = migratedConfig.globals?.['ts-jest']
  migratedConfig.transform = migrateGlobalConfigToTransformConfig(migratedConfig.transform, globalsTsJestConfig)
  migratedConfig.transform = migratePresetToTransformConfig(migratedConfig.transform, preset, globalsTsJestConfig)

  cleanupConfig(actualConfig)
  cleanupConfig(migratedConfig)
  const before = stableStringify(actualConfig)
  const after = stableStringify(migratedConfig)
  if (after === before) {
    process.stderr.write(`
No migration needed for given Jest configuration
    `)

    return
  }

  const stringify = file.endsWith('.json') ? JSON.stringify : stringifyJson5
  const prefix = file.endsWith('.json') ? '"jest": ' : 'module.exports = '

  // output new config
  process.stderr.write(`
Migrated Jest configuration:
`)
  process.stdout.write(`${prefix}${stringify(migratedConfig, undefined, '  ')}\n`)
}

function cleanupConfig(config: Config.InitialOptions): void {
  if (config.globals) {
    delete config.globals['ts-jest']
    if (!Object.keys(config.globals).length) {
      delete config.globals
    }
  }
  if (config.transform && !Object.keys(config.transform).length) {
    delete config.transform
  }
  if (config.moduleFileExtensions) {
    config.moduleFileExtensions = dedupSort(config.moduleFileExtensions)
    if (!config.moduleFileExtensions.length) delete config.moduleFileExtensions
  }
  if (config.testMatch) {
    config.testMatch = dedupSort(config.testMatch)
    if (!config.testMatch.length) delete config.testMatch
  }
  delete config.preset
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dedupSort(arr: any[]) {
  return arr
    .filter((s, i, a) => a.findIndex((e) => s.toString() === e.toString()) === i)
    .sort((a, b) => (a.toString() > b.toString() ? 1 : a.toString() < b.toString() ? -1 : 0))
}

/**
 * @internal
 */
export const help: CliCommand = async () => {
  process.stdout.write(`
Usage:
  ts-jest config:migrate [options] <config-file>

Arguments:
  <config-file>         Can be a js or json Jest config file. If it is a
                        package.json file, the configuration will be read from
                        the "jest" property.

Options:
  --js ts|babel         Process .js files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --no-jest-preset      Disable the use of Jest presets
`)
}
