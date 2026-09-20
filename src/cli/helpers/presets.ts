import type { TsJestPresets } from '../../types'

/** @internal */
export const enum JestPresetNames {
  default = 'ts-jest/presets/default',
  defaultLegacy = 'ts-jest/presets/default-legacy',
  defaultEsm = 'ts-jest/presets/default-esm',
  defaultEsmLegacy = 'ts-jest/presets/default-esm-legacy',
  jsWithTs = 'ts-jest/presets/js-with-ts',
  jsWithTsLegacy = 'ts-jest/presets/js-with-ts-legacy',
  jsWithTsEsm = 'ts-jest/presets/js-with-ts-esm',
  jsWithTsEsmLegacy = 'ts-jest/presets/js-with-ts-esm-legacy',
  jsWIthBabel = 'ts-jest/presets/js-with-babel',
  jsWithBabelLegacy = 'ts-jest/presets/js-with-babel-legacy',
  jsWithBabelEsm = 'ts-jest/presets/js-with-babel-esm',
  jsWithBabelEsmLegacy = 'ts-jest/presets/js-with-babel-esm-legacy',
}

/** @internal */
export interface TsJestPresetDescriptor {
  name: string
  fullName: string
  label: string
  jsVarName: string
  value: TsJestPresets
  isDefault: boolean
  jsImport(varName?: string): string
}

const definePreset = (fullName: string): TsJestPresetDescriptor => ({
  fullName,
  get name() {
    return this.isDefault ? 'ts-jest' : fullName
  },
  get label() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return fullName.split('/').pop()!
  },
  get jsVarName() {
    return this.isDefault
      ? 'defaults'
      : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fullName
          .split('/')
          .pop()!
          // eslint-disable-next-line no-useless-escape
          .replace(/\-([a-z])/g, (_, l) => l.toUpperCase())
  },
  get value() {
    return require(`../../../${fullName.replace(/^ts-jest\//, '')}/jest-preset`)
  },
  jsImport(varName = 'tsjPreset') {
    return `const { ${this.jsVarName}: ${varName} } = require('ts-jest/presets')`
  },
  get isDefault() {
    return fullName === JestPresetNames.default
  },
})

/** @internal */
export const allPresets: Record<string, TsJestPresetDescriptor> = {}
/** @internal */
export const defaults = (allPresets[JestPresetNames.default] = definePreset(JestPresetNames.default))
/** @internal */
export const defaultsLegacy = (allPresets[JestPresetNames.defaultLegacy] = definePreset(JestPresetNames.defaultLegacy))
/** @internal */
export const defaultsEsm = (allPresets[JestPresetNames.defaultEsm] = definePreset(JestPresetNames.defaultEsm))
/** @internal */
export const defaultsEsmLegacy = (allPresets[JestPresetNames.defaultEsmLegacy] = definePreset(
  JestPresetNames.defaultEsmLegacy,
))
/** @internal */
export const jsWithTs = (allPresets[JestPresetNames.jsWithTs] = definePreset(JestPresetNames.jsWithTs))
/** @internal */
export const jsWithTsLegacy = (allPresets[JestPresetNames.jsWithTsLegacy] = definePreset(
  JestPresetNames.jsWithTsLegacy,
))
/** @internal */
export const jsWithTsEsm = (allPresets[JestPresetNames.jsWithTsEsm] = definePreset(JestPresetNames.jsWithTsEsm))
/** @internal */
export const jsWithTsEsmLegacy = (allPresets[JestPresetNames.jsWithTsEsmLegacy] = definePreset(
  JestPresetNames.jsWithTsEsmLegacy,
))
/** @internal */
export const jsWIthBabel = (allPresets[JestPresetNames.jsWIthBabel] = definePreset(JestPresetNames.jsWIthBabel))
/** @internal */
export const jsWithBabelLegacy = (allPresets[JestPresetNames.jsWithBabelLegacy] = definePreset(
  JestPresetNames.jsWithBabelLegacy,
))
/** @internal */
export const jsWithBabelEsm = (allPresets[JestPresetNames.jsWithBabelEsm] = definePreset(
  JestPresetNames.jsWithBabelEsm,
))
/** @internal */
export const jsWithBabelEsmLegacy = (allPresets[JestPresetNames.jsWithBabelEsmLegacy] = definePreset(
  JestPresetNames.jsWithBabelEsmLegacy,
))
