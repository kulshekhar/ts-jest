import type { TsJestPresets } from '../../types'

/** @internal */
export const enum JestPresetNames {
  default = 'ts-jest/presets/default',
  jsWithTs = 'ts-jest/presets/js-with-ts',
  jsWIthBabel = 'ts-jest/presets/js-with-babel',
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allPresets: Record<JestPresetNames, TsJestPresetDescriptor> = {} as any
/** @internal */
export const defaults = (allPresets[JestPresetNames.default] = definePreset(JestPresetNames.default))
/** @internal */
export const jsWithTs = (allPresets[JestPresetNames.jsWithTs] = definePreset(JestPresetNames.jsWithTs))
/** @internal */
export const jsWIthBabel = (allPresets[JestPresetNames.jsWIthBabel] = definePreset(JestPresetNames.jsWIthBabel))
