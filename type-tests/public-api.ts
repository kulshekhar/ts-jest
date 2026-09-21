import type { TsConfigJson } from 'type-fest'

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
} from '../src'
import type { DefaultPreset, TsConfigCompilerOptionsJson, TsJestTransformerOptions } from '../src'

type PublicApi = typeof import('../src')

type RemovedApiNamesMustBeAbsent = [
  // @ts-expect-error RawCompilerOptions was removed in v30.
  PublicApi['RawCompilerOptions'],
  // @ts-expect-error TsJestGlobalOptions was removed in v30.
  PublicApi['TsJestGlobalOptions'],
  // @ts-expect-error ProjectConfigTsJest was removed in v30.
  PublicApi['ProjectConfigTsJest'],
  // @ts-expect-error TransformOptionsTsJest was removed in v30.
  PublicApi['TransformOptionsTsJest'],
  // @ts-expect-error GlobalConfigTsJest was removed in v30.
  PublicApi['GlobalConfigTsJest'],
  // @ts-expect-error InitialOptionsTsJest was removed in v30.
  PublicApi['InitialOptionsTsJest'],
  // @ts-expect-error TsJestPresets was removed in v30.
  PublicApi['TsJestPresets'],
  // @ts-expect-error The positional createJestPreset was removed in v30.
  PublicApi['createJestPreset'],
]

const compilerOptions: TsConfigCompilerOptionsJson = { target: 'ES2020' }
const transformerOptions: TsJestTransformerOptions = {
  tsconfig: { ...compilerOptions } satisfies TsConfigJson.CompilerOptions,
}

const defaultPreset: DefaultPreset = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', transformerOptions],
  },
}

void defaultPreset
void (undefined as RemovedApiNamesMustBeAbsent | undefined)
void [
  createDefaultPreset,
  createDefaultLegacyPreset,
  createDefaultEsmPreset,
  createDefaultEsmLegacyPreset,
  createJsWithTsPreset,
  createJsWithTsLegacyPreset,
  createJsWithTsEsmPreset,
  createJsWithTsEsmLegacyPreset,
  createJsWithBabelPreset,
  createJsWithBabelLegacyPreset,
  createJsWithBabelEsmPreset,
  createJsWithBabelEsmLegacyPreset,
]
