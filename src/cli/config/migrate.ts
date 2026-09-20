import { existsSync, readFileSync } from 'fs'
import { Module } from 'module'
import { basename, dirname, resolve } from 'path'
import { pathToFileURL } from 'url'

import type { Config } from '@jest/types'
import { createLogger } from 'bs-logger'
import stableStringify from 'fast-json-stable-stringify'
import { stringify as stringifyJson5 } from 'json5'

import type { CliCommand, CliCommandArgs } from '..'
import { ESM_TS_JS_TRANSFORM_PATTERN, ESM_TS_TRANSFORM_PATTERN } from '../../constants'
import {
  createDefaultEsmLegacyPreset,
  createDefaultEsmPreset,
  createDefaultLegacyPreset,
  createDefaultPreset,
  createJsWithBabelEsmLegacyPreset,
  createJsWithBabelEsmPreset,
  createJsWithBabelLegacyPreset,
  createJsWithBabelPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithTsEsmPreset,
  createJsWithTsLegacyPreset,
  createJsWithTsPreset,
} from '../../presets/create-jest-preset'
import type { TsJestPresets, TsJestTransformerOptions } from '../../types'
import { backportJestConfig } from '../../utils/backports'
import { JestPresetNames, type TsJestPresetDescriptor, allPresets } from '../helpers/presets'

type TsJestTransformerName = 'ts-jest' | 'ts-jest/legacy'

const normalizeTransformerPath = (transformerPath: string): string => transformerPath.replace(/\\/g, '/')

const resolvedTsJestTransformers = new Map<string, TsJestTransformerName>([
  [normalizeTransformerPath(resolve(__dirname, '../../../dist/index.js')), 'ts-jest'],
  [normalizeTransformerPath(resolve(__dirname, '../../../dist/legacy/index.js')), 'ts-jest/legacy'],
  ['node_modules/ts-jest', 'ts-jest'],
  ['node_modules/ts-jest/preprocessor.js', 'ts-jest'],
  ['<rootDir>/node_modules/ts-jest', 'ts-jest'],
  ['<rootDir>/node_modules/ts-jest/preprocessor.js', 'ts-jest'],
  ['ts-jest', 'ts-jest'],
  ['ts-jest/legacy', 'ts-jest/legacy'],
])

for (const [specifier, transformerName] of [
  ['ts-jest', 'ts-jest'],
  ['ts-jest/legacy', 'ts-jest/legacy'],
] as const) {
  try {
    resolvedTsJestTransformers.set(
      normalizeTransformerPath(require.resolve(specifier, { paths: [process.cwd()] })),
      transformerName,
    )
  } catch {
    // The package may not be resolvable from the current working directory during local development.
  }
}

const getTsJestTransformer = (transformer: unknown): 'ts-jest' | 'ts-jest/legacy' | undefined => {
  if (transformer === 'ts-jest' || transformer === 'ts-jest/legacy') return transformer
  if (typeof transformer !== 'string') return undefined

  return resolvedTsJestTransformers.get(normalizeTransformerPath(transformer))
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const migrateTransformValue = (transformValue: unknown, globalsTsJestConfig: TsJestTransformerOptions | undefined) => {
  if (typeof transformValue === 'string') {
    const transformer = getTsJestTransformer(transformValue)
    if (!transformer) return transformValue

    return globalsTsJestConfig ? [transformer, globalsTsJestConfig] : transformer
  }
  if (!Array.isArray(transformValue)) return transformValue

  const [transformer, options] = transformValue
  const normalizedTransformer = getTsJestTransformer(transformer)
  if (!normalizedTransformer) return transformValue
  if (!globalsTsJestConfig) return [normalizedTransformer, ...transformValue.slice(1)]

  return [normalizedTransformer, { ...globalsTsJestConfig, ...(isRecord(options) ? options : {}) }]
}

const migrateGlobalConfigToTransformConfig = (
  transformConfig: Config.InitialOptions['transform'],
  globalsTsJestConfig: TsJestTransformerOptions | undefined,
) => {
  if (!transformConfig) return {}

  return Object.entries(transformConfig).reduce(
    (previousValue, [key, transformValue]) => ({
      ...previousValue,
      [key]: migrateTransformValue(transformValue, globalsTsJestConfig),
    }),
    {},
  )
}

const migratePresetToConfig = (
  config: Config.InitialOptions,
  preset: TsJestPresetDescriptor | undefined,
  globalsTsJestConfig: TsJestTransformerOptions | undefined,
) => {
  if (!preset) return config

  const configFromPreset = createPresetTransform(preset, globalsTsJestConfig)

  return {
    ...config,
    ...(config.extensionsToTreatAsEsm === undefined && configFromPreset.extensionsToTreatAsEsm !== undefined
      ? { extensionsToTreatAsEsm: configFromPreset.extensionsToTreatAsEsm }
      : {}),
    ...(config.moduleFileExtensions === undefined && configFromPreset.moduleFileExtensions !== undefined
      ? { moduleFileExtensions: configFromPreset.moduleFileExtensions }
      : {}),
    ...(config.testMatch === undefined && configFromPreset.testMatch !== undefined
      ? { testMatch: configFromPreset.testMatch }
      : {}),
    transform: mergeTransformConfigs(config.transform, configFromPreset.transform),
  }
}

const mergeTransformConfigs = (
  userTransform: Config.InitialOptions['transform'],
  presetTransform: Config.InitialOptions['transform'],
) => {
  const mergedTransform = { ...userTransform }
  Object.entries(presetTransform ?? {}).forEach(([pattern, transform]) => {
    if (!(pattern in mergedTransform)) mergedTransform[pattern] = transform
  })

  return mergedTransform
}

const createPresetTransform = (
  preset: TsJestPresetDescriptor,
  globalsTsJestConfig: TsJestTransformerOptions | undefined,
): TsJestPresets => {
  const isEsm = preset.fullName.includes('-esm')
  const isLegacy = preset.fullName.includes('-legacy')

  if (preset.fullName.includes('js-with-babel')) {
    if (isEsm) {
      return isLegacy
        ? createJsWithBabelEsmLegacyPreset(globalsTsJestConfig)
        : createJsWithBabelEsmPreset(globalsTsJestConfig)
    }

    return isLegacy ? createJsWithBabelLegacyPreset(globalsTsJestConfig) : createJsWithBabelPreset(globalsTsJestConfig)
  }
  if (preset.fullName.includes('js-with-ts')) {
    if (isEsm) {
      return isLegacy
        ? createJsWithTsEsmLegacyPreset(globalsTsJestConfig)
        : createJsWithTsEsmPreset(globalsTsJestConfig)
    }

    return isLegacy ? createJsWithTsLegacyPreset(globalsTsJestConfig) : createJsWithTsPreset(globalsTsJestConfig)
  }
  if (isEsm) {
    return isLegacy ? createDefaultEsmLegacyPreset(globalsTsJestConfig) : createDefaultEsmPreset(globalsTsJestConfig)
  }

  return isLegacy ? createDefaultLegacyPreset(globalsTsJestConfig) : createDefaultPreset(globalsTsJestConfig)
}

const cloneConfig = (config: Config.InitialOptions): Config.InitialOptions => {
  const globals = config.globals
  const tsJestGlobals = globals?.['ts-jest']

  return {
    ...config,
    ...(globals
      ? {
          globals: {
            ...globals,
            ...(tsJestGlobals && typeof tsJestGlobals === 'object' ? { 'ts-jest': { ...tsJestGlobals } } : {}),
          },
        }
      : {}),
  }
}

const hasKnownPresetTransform = (transformConfig: Config.InitialOptions['transform']): boolean => {
  if (!transformConfig) return false

  return Object.entries(transformConfig).some(([pattern, transform]) => {
    const isEsmPattern = pattern === ESM_TS_TRANSFORM_PATTERN || pattern === ESM_TS_JS_TRANSFORM_PATTERN
    if (isEsmPattern) return true
    if (!Array.isArray(transform)) return getTsJestTransformer(transform) !== undefined

    return getTsJestTransformer(transform[0]) !== undefined
  })
}

const resolvePreset = (preset: unknown): TsJestPresetDescriptor | undefined => {
  if (preset === 'ts-jest') return allPresets[JestPresetNames.default]
  if (typeof preset !== 'string') return undefined

  return allPresets[preset]
}

const warnUnknownPreset = (preset: unknown): void => {
  const value = typeof preset === 'string' ? `"${preset}"` : 'a non-string value'
  process.stderr.write(
    `\nUnable to migrate unknown Jest preset ${value}. Preserve the preset and migrate its transform configuration manually.\n`,
  )
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
  if (!/\.(js|json|cjs|mjs|ts|cts|mts)$/.test(name)) {
    throw new TypeError(`Configuration file ${file} must be a JavaScript, TypeScript, or JSON file.`)
  }
  if (name.endsWith('.mts')) {
    warnUnsupportedConfig(file)

    return
  }

  const isEsmConfig = isEsmConfigFile(filePath, name)
  let actualConfig: Config.InitialOptions = await loadConfig(filePath, name)
  if (isPackage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actualConfig = (actualConfig as any).jest
  }
  if (!actualConfig) actualConfig = {}

  // migrate
  // first we backport our options on a copy so the source config remains available for comparison
  const requestedPreset = actualConfig.preset
  const knownRequestedPreset = requestedPreset == null ? undefined : resolvePreset(requestedPreset)
  if (requestedPreset != null && !knownRequestedPreset) {
    warnUnknownPreset(requestedPreset)
    outputConfig(file, actualConfig, isPackage, isEsmConfig, 'Jest configuration requires manual migration:')

    return
  }

  let migratedConfig = backportJestConfig(nullLogger, cloneConfig(actualConfig))
  let preset: TsJestPresetDescriptor | undefined
  if (requestedPreset != null) {
    preset = knownRequestedPreset
  } else {
    if (args.js) {
      preset = args.js === 'babel' ? allPresets[JestPresetNames.jsWIthBabel] : allPresets[JestPresetNames.jsWithTs]
    } else if (!hasKnownPresetTransform(migratedConfig.transform)) {
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
  else if (
    migratedConfig.testMatch?.length &&
    preset &&
    Array.isArray(preset.value.testMatch) &&
    Array.isArray(migratedConfig.testMatch)
  ) {
    const presetValue = dedupSort(preset.value.testMatch).join('::')
    const migratedValue = dedupSort(migratedConfig.testMatch).join('::')
    if (presetValue === migratedValue) {
      delete migratedConfig.testMatch
    }
  }

  const globalsTsJestConfig = migratedConfig.globals?.['ts-jest'] as TsJestTransformerOptions | undefined
  migratedConfig.transform = migrateGlobalConfigToTransformConfig(migratedConfig.transform, globalsTsJestConfig)
  migratedConfig = migratePresetToConfig(migratedConfig, preset, globalsTsJestConfig)

  cleanupConfig(migratedConfig)
  const before = stableStringify(actualConfig)
  const after = stableStringify(migratedConfig)
  if (after === before) {
    process.stderr.write(`
No migration needed for given Jest configuration
    `)

    return
  }

  outputConfig(file, migratedConfig, isPackage, isEsmConfig, 'Migrated Jest configuration:')
}

const outputConfig = (
  file: string,
  config: Config.InitialOptions,
  isPackage: boolean,
  isEsmConfig: boolean,
  message: string,
): void => {
  const stringify = file.endsWith('.json') ? JSON.stringify : stringifyJson5
  const prefix = isPackage
    ? '"jest": '
    : file.endsWith('.json')
    ? ''
    : isEsmConfig
    ? 'export default '
    : 'module.exports = '

  process.stderr.write(`\n${message}\n`)
  process.stdout.write(`${prefix}${stringify(config, undefined, '  ')}\n`)
}

const isEsmConfigFile = (filePath: string, name: string): boolean => {
  if (name.endsWith('.mjs')) return true
  if (!/\.(js|ts)$/.test(name)) return false

  return findPackageType(filePath) === 'module'
}

const findPackageType = (filePath: string): string | undefined => {
  let directory = dirname(filePath)
  while (true) {
    const packagePath = resolve(directory, 'package.json')
    try {
      const packageJson = require(packagePath) as { type?: unknown }

      return packageJson.type === 'module' || packageJson.type === 'commonjs' ? packageJson.type : undefined
    } catch (error) {
      const isMissingPackage =
        error instanceof Error &&
        'code' in error &&
        error.code === 'MODULE_NOT_FOUND' &&
        error.message.includes(packagePath)
      if (!isMissingPackage) return undefined
    }

    const parent = dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}

const warnUnsupportedConfig = (file: string): void => {
  process.stderr.write(
    `\nUnable to migrate ${file}: .mts configs require an ESM TypeScript loader that this CLI cannot safely serialize. ` +
      'Use .ts/.cts or migrate this configuration manually. Source configuration was not changed.\n',
  )
}

const loadConfig = async (filePath: string, name: string): Promise<Config.InitialOptions> => {
  if (/\.(cts|ts)$/.test(name)) return loadTypeScriptConfig(filePath)

  try {
    const loaded = require(filePath)

    return /\.(cts|mjs|mts|ts)$/.test(name) && loaded?.default ? loaded.default : loaded
  } catch (error) {
    const isEsmError = error instanceof Error && 'code' in error && error.code === 'ERR_REQUIRE_ESM'

    if (!/\.(mjs|mts)$/.test(name) && !isEsmError) throw error

    const loaded = await import(pathToFileURL(filePath).href)

    return loaded.default ?? loaded
  }
}

const loadTypeScriptConfig = (filePath: string): Config.InitialOptions => {
  let typescript: typeof import('typescript')
  try {
    // TypeScript is a peer dependency and is required only when migrating a TS config.
    typescript = require('typescript')
  } catch {
    throw new Error(`Unable to load TypeScript configuration ${filePath}. Install TypeScript to migrate it.`)
  }

  const source = readFileSync(filePath, 'utf8')
  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
    fileName: filePath,
  })
  const nodeModule = Module as typeof Module & { _nodeModulePaths(path: string): string[] }
  const configModule = new Module(filePath, module) as Module & { _compile(content: string, filename: string): void }
  configModule.filename = filePath
  configModule.paths = nodeModule._nodeModulePaths(dirname(filePath))
  configModule._compile(outputText, filePath)

  return configModule.exports.default ?? configModule.exports
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
  if (config.testMatch && Array.isArray(config.testMatch)) {
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
  <config-file>         Can be a JavaScript, TypeScript (.ts/.cts), or JSON Jest
                        config file. ESM TypeScript (.mts) requires manual
                        migration. If it is a package.json file, the
                        configuration will be read from the "jest" property.

Options:
  --js ts|babel         Process .js files with ts-jest if 'ts' or with
                        babel-jest if 'babel'
  --no-jest-preset      Disable the use of Jest presets
`)
}
