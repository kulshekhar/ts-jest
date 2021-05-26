import { existsSync } from 'fs'
import { basename, resolve } from 'path'

import type { Config } from '@jest/types'
import { createLogger } from 'bs-logger'
import stableStringify from 'fast-json-stable-stringify'
import { stringify as stringifyJson5 } from 'json5'
import type { Arguments } from 'yargs'

import type { CliCommand } from '..'
import { backportJestConfig } from '../../utils/backports'
import { JestPresetNames, TsJestPresetDescriptor, allPresets, defaults } from '../helpers/presets'

/**
 * @internal
 */
export const run: CliCommand = async (args: Arguments /* , logger: Logger*/) => {
  const nullLogger = createLogger({ targets: [] })
  const file = args._[0]?.toString()
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
  let actualConfig: Config.InitialOptions = require(filePath)
  if (isPackage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actualConfig = (actualConfig as any).jest
  }
  if (!actualConfig) actualConfig = {}

  // migrate
  // first we backport our options
  const migratedConfig = backportJestConfig(nullLogger, actualConfig)
  let presetName: JestPresetNames | undefined
  let preset: TsJestPresetDescriptor | undefined
  // then we check if we can use `preset`
  if (!migratedConfig.preset && args.jestPreset) {
    // find the best preset
    if (args.js) {
      presetName = args.js === 'babel' ? JestPresetNames.jsWIthBabel : JestPresetNames.jsWithTs
    } else {
      // try to detect what transformer the js extensions would target
      const jsTransformers = Object.keys(migratedConfig.transform || {}).reduce((list, pattern) => {
        if (RegExp(pattern.replace(/^<rootDir>\/?/, '/dummy-project/')).test('/dummy-project/src/foo.js')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let transformer: string = (migratedConfig.transform as any)[pattern]
          if (/\bbabel-jest\b/.test(transformer)) transformer = 'babel-jest'
          else if (/\ts-jest\b/.test(transformer)) transformer = 'ts-jest'

          return [...list, transformer]
        }

        return list
      }, [] as string[])
      // depending on the transformer found, we use one or the other preset
      const jsWithTs = jsTransformers.includes('ts-jest')
      const jsWithBabel = jsTransformers.includes('babel-jest')
      if (jsWithBabel && !jsWithTs) {
        presetName = JestPresetNames.jsWIthBabel
      } else if (jsWithTs && !jsWithBabel) {
        presetName = JestPresetNames.jsWithTs
      } else {
        // sounds like js files are NOT handled, or handled with a unknown transformer, so we do not need to handle it
        presetName = JestPresetNames.default
      }
    }
    // ensure we are using a preset
    presetName = presetName ?? JestPresetNames.default
    preset = allPresets[presetName]
    footNotes.push(
      `Detected preset '${preset.label}' as the best matching preset for your configuration.
Visit https://kulshekhar.github.io/ts-jest/user/config/#jest-preset for more information about presets.
`,
    )
  } else if (migratedConfig.preset?.startsWith('ts-jest')) {
    if (args.jestPreset === false) {
      delete migratedConfig.preset
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preset = (allPresets as any)[migratedConfig.preset] ?? defaults
    }
  }

  // enforce the correct name
  if (preset) migratedConfig.preset = preset.name

  // check the extensions
  if (migratedConfig.moduleFileExtensions?.length && preset) {
    const presetValue = dedupSort(preset.value.moduleFileExtensions ?? []).join('::')
    const migratedValue = dedupSort(migratedConfig.moduleFileExtensions).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.moduleFileExtensions
    }
  }
  // there is a testRegex, remove our testMatch
  if ((typeof migratedConfig.testRegex === 'string' || migratedConfig.testRegex?.length) && preset) {
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

  // migrate the transform
  if (migratedConfig.transform) {
    Object.keys(migratedConfig.transform).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (migratedConfig.transform as any)[key]
      if (typeof val === 'string' && /\/?ts-jest(?:\/preprocessor\.js)?$/.test(val)) {
        // eslint-disable-next-line
        ;(migratedConfig.transform as any)[key] = 'ts-jest'
      }
    })
  }
  // check if it's the same as the preset's one
  if (
    preset &&
    migratedConfig.transform &&
    stableStringify(migratedConfig.transform) === stableStringify(preset.value.transform)
  ) {
    delete migratedConfig.transform
  }

  // cleanup
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
  if (preset && migratedConfig.transform) {
    footNotes.push(`
I couldn't check if your "transform" value is the same as mine which is: ${stringify(
      preset.value.transform,
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

function cleanupConfig(config: Config.InitialOptions): void {
  if (config.globals) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((config as any).globals['ts-jest'] && Object.keys((config as any).globals['ts-jest']).length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (config as any).globals['ts-jest']
    }
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
  if (config.preset === JestPresetNames.default) config.preset = defaults.name
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
