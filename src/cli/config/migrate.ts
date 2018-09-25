import { createLogger } from 'bs-logger'
import stringifyJson from 'fast-json-stable-stringify'
import { existsSync } from 'fs'
import { stringify as stringifyJson5 } from 'json5'
import { basename, resolve } from 'path'
import { Arguments } from 'yargs'

import { CliCommand } from '..'
import { TsJestPresets } from '../../types'
import { backportJestConfig } from '../../util/backports'

const DEFAULT_PRESET = 'ts-jest/presets/default'

/**
 * @internal
 */
export const run: CliCommand = async (args: Arguments /*, logger: Logger*/) => {
  const nullLogger = createLogger({ targets: [] })
  const file = args._[0]
  const filePath = resolve(process.cwd(), file)
  const footNotes: string[] = []
  if (!existsSync(filePath)) {
    throw new Error(`Configuration file ${file} does not exists.`)
  }
  const name = basename(file)
  const isPackage = name === 'package.json'
  if (!/\.(js|json)$/.test(name)) {
    throw new TypeError(`Configuration file ${file} must be a JavaScript or JSON file.`)
  }
  let actualConfig: jest.InitialOptions = require(filePath)
  if (isPackage) {
    actualConfig = (actualConfig as any).jest
  }
  if (!actualConfig) actualConfig = {}

  // migrate
  // first we backport our options
  const migratedConfig = backportJestConfig(nullLogger, actualConfig)
  let presetName: string | undefined
  // then we check if we can use `preset`
  if (!migratedConfig.preset && args.jestPreset) {
    // find the best preset
    if (args.allowJs) presetName = 'ts-jest/presets/js-with-ts'
    else {
      // try to detect what transformer the js extensions would target
      const jsTransformers = Object.keys(migratedConfig.transform || {}).reduce(
        (list, pattern) => {
          if (RegExp(pattern.replace(/^<rootDir>\/?/, '/dummy-project/')).test('/dummy-project/src/foo.js')) {
            let transformer: string = (migratedConfig.transform as any)[pattern]
            if (/\bbabel-jest\b/.test(transformer)) transformer = 'babel-jest'
            else if (/\ts-jest\b/.test(transformer)) transformer = 'ts-jest'
            return [...list, transformer]
          }
          return list
        },
        [] as string[],
      )
      // depending on the transformer found, we use one or the other preset
      const jsWithTs = jsTransformers.includes('ts-jest')
      const jsWithBabel = jsTransformers.includes('babel-jest')
      if (jsWithBabel && !jsWithTs) {
        presetName = 'ts-jest/presets/js-with-babel'
      } else if (jsWithTs && !jsWithBabel) {
        presetName = 'ts-jest/presets/js-with-ts'
      } else {
        // sounds like js files are NOT handled, or handled with a unknown transformer, so we do not need to handle it
        presetName = DEFAULT_PRESET
      }
    }
    // ensure we are using a preset
    presetName = presetName || DEFAULT_PRESET
    migratedConfig.preset = presetName
    footNotes.push(
      `Detected preset '${presetName.replace(
        /^ts-jest\/presets\//,
        '',
      )}' as the best matching preset for your configuration.\nVisit https://kulshekhar.github.io/ts-jest/user/config/#jest-preset for more information about presets.\n`,
    )
  } else if (migratedConfig.preset && migratedConfig.preset.startsWith('ts-jest')) {
    if (args.jestPreset === false) {
      delete migratedConfig.preset
    } else {
      presetName = migratedConfig.preset
    }
  }
  const presets: TsJestPresets | undefined = presetName
    ? require(`../../../${presetName.replace(/^ts-jest\//, '')}/jest-preset`)
    : undefined

  // check the extensions
  if (migratedConfig.moduleFileExtensions && migratedConfig.moduleFileExtensions.length && presets) {
    const presetValue = dedupSort(presets.moduleFileExtensions).join('::')
    const migratedValue = dedupSort(migratedConfig.moduleFileExtensions).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.moduleFileExtensions
    }
  }
  // there is a testRegex, remove our testMatch
  if (migratedConfig.testRegex && presets) {
    migratedConfig.testMatch = null as any
  }
  // check the testMatch
  else if (migratedConfig.testMatch && migratedConfig.testMatch.length && presets) {
    const presetValue = dedupSort(presets.testMatch).join('::')
    const migratedValue = dedupSort(migratedConfig.testMatch).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.testMatch
    }
  }

  // migrate the transform
  if (migratedConfig.transform) {
    Object.keys(migratedConfig.transform).forEach(key => {
      const val = (migratedConfig.transform as any)[key]
      if (typeof val === 'string' && /\/?ts-jest(?:\/preprocessor\.js)?$/.test(val)) {
        // tslint:disable-next-line:semicolon
        ;(migratedConfig.transform as any)[key] = 'ts-jest'
      }
    })
  }
  // check if it's the same as the preset's one
  if (
    presets &&
    migratedConfig.transform &&
    stringifyJson(migratedConfig.transform) === stringifyJson(presets.transform)
  ) {
    delete migratedConfig.transform
  }

  // cleanup
  cleanupConfig(actualConfig)
  cleanupConfig(migratedConfig)
  const before = stringifyJson(actualConfig)
  const after = stringifyJson(migratedConfig)
  if (after === before) {
    process.stderr.write(`
No migration needed for given Jest configuration
    `)
    return
  }

  const stringify = /\.json$/.test(file) ? JSON.stringify : stringifyJson5
  const prefix = /\.json$/.test(file) ? '"jest": ' : 'module.exports = '

  // if we are using preset, inform the user that he might be able to remove some section(s)
  // we couldn't check for equality
  //   if (usesPreset && migratedConfig.testMatch) {
  //     footNotes.push(`
  // I couldn't check if your "testMatch" value is the same as mine which is: ${stringify(
  //       presets.testMatch,
  //       undefined,
  //       '  ',
  //     )}
  // If it is the case, you can safely remove the "testMatch" from what I've migrated.
  // `)
  //   }
  if (presets && migratedConfig.transform) {
    footNotes.push(`
I couldn't check if your "transform" value is the same as mine which is: ${stringify(
      presets.transform,
      undefined,
      '  ',
    )}
If it is the case, you can safely remove the "transform" from what I've migrated.
`)
  }

  // output new config
  process.stderr.write(`
Migrated Jest configuration:
`)
  process.stdout.write(`${prefix}${stringify(migratedConfig, undefined, '  ')}\n`)
  if (footNotes.length) {
    process.stderr.write(`
${footNotes.join('\n')}
`)
  }
}

function cleanupConfig(config: jest.InitialOptions): void {
  if (config.globals) {
    if ((config as any).globals['ts-jest'] && Object.keys((config as any).globals['ts-jest']).length === 0) {
      delete (config as any).globals['ts-jest']
    }
    if (Object.keys(config.globals).length === 0) {
      delete config.globals
    }
  }
  if (config.transform && Object.keys(config.transform).length === 0) {
    delete config.transform
  }
  if (config.moduleFileExtensions) {
    config.moduleFileExtensions = dedupSort(config.moduleFileExtensions)
    if (config.moduleFileExtensions.length === 0) delete config.moduleFileExtensions
  }
  if (config.testMatch) {
    config.testMatch = dedupSort(config.testMatch)
    if (config.testMatch.length === 0) delete config.testMatch
  }
  if (config.preset === DEFAULT_PRESET) config.preset = 'ts-jest'
}

function dedupSort(arr: any[]) {
  return arr
    .filter((s, i, a) => a.findIndex(e => s.toString() === e.toString()) === i)
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
  --allow-js            ts-jest will be used to process JS files as well
  --no-jest-preset      Disable the use of Jest presets
`)
}
