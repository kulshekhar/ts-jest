import type { TransformedSource, Transformer, TransformOptions } from '@jest/transform'
import type { Config } from '@jest/types'
import type * as babelJest from 'babel-jest'
import type * as _babel from 'babel__core'
import type * as _ts from 'typescript'

import {
  ESM_JS_TRANSFORM_PATTERN,
  ESM_TS_JS_TRANSFORM_PATTERN,
  ESM_TS_TRANSFORM_PATTERN,
  JS_TRANSFORM_PATTERN,
  TS_JS_TRANSFORM_PATTERN,
  TS_TRANSFORM_PATTERN,
} from './constants'
import type { ConfigSet } from './legacy/config/config-set'
import type { RawCompilerOptions } from './raw-compiler-options'

/**
 * @internal
 */
export type TBabelCore = typeof _babel
/**
 * @internal
 */
export type TBabelJest = typeof babelJest
export type TTypeScript = typeof _ts
// Stimulate `esbuild` type to avoid import `esbuild` while building the assets which are shipped to npm
/**
 * @internal
 */
export interface TEsBuild {
  transformSync(
    input: string,
    options?: { loader: 'ts' | 'js'; format: 'cjs' | 'esm'; target: string },
  ): { code: string; map: string }
}
/**
 * @internal
 */
export type BabelJestTransformer = {
  [K in Exclude<keyof Transformer, 'createTransformer'>]: Exclude<Transformer[K], undefined>
}
/**
 * Don't mark as internal because it is used in TsJestGlobalOptions which is an exposed type
 */
export type BabelConfig = _babel.TransformOptions

export interface AstTransformer<T = Record<string, unknown>> {
  path: string
  options?: T
}

export interface ConfigCustomTransformer {
  before?: Array<string | AstTransformer>
  after?: Array<string | AstTransformer>
  afterDeclarations?: Array<string | AstTransformer>
}

/**
 * @deprecated use `TsJestTransformerOptions` instead
 */
export interface TsJestGlobalOptions {
  /**
   * Compiler options. It can be:
   * - `true` (or `undefined`, it's the default): use default tsconfig file
   * - `false`: do NOT use default config file
   * - `path/to/tsconfig.json`: path to a specific tsconfig file (<rootDir> can be used)
   * - `{...}`: an object with inline compiler options
   *
   * @default undefined uses the default tsconfig file
   */
  tsconfig?: boolean | string | RawCompilerOptions

  /**
   * @deprecated use `isolatedModules` in `tsconfig` instead
   *
   * Compiles files as isolated modules (disables some features)
   *
   * @default undefined (disabled)
   */
  isolatedModules?: boolean

  /**
   * Compiler to use
   *
   * @default 'typescript'
   */
  compiler?: 'typescript' | 'ttypescript' | string

  /**
   * Custom transformers (mostly used by jest presets)
   */
  astTransformers?: ConfigCustomTransformer

  /**
   * TS diagnostics - less to be reported if `isolatedModules` is `true`. It can be:
   * - `true` (or `undefined`, it's the default): show all diagnostics
   * - `false`: hide diagnostics of all files (kind of useless)
   * - `{...}`: an inline object with fine grained settings
   *
   * @default undefined shows all diagnostics
   */
  diagnostics?:
    | boolean
    | {
        /**
         * Enables colorful and pretty output of errors
         *
         * @default undefined (enabled)
         */
        pretty?: boolean
        /**
         * List of TypeScript diagnostic error codes to ignore
         * [here](https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json).
         *
         * @see https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json
         * @default [6059,18002,18003]
         */
        ignoreCodes?: number | string | Array<number | string>
        /**
         * If specified, diagnostics of source files which path **matches** will be ignored
         */
        exclude?: string[]
        /**
         * Logs TypeScript errors to stderr instead of throwing exceptions
         *
         * @default undefined (disabled)
         */
        warnOnly?: boolean
      }

  /**
   * Babel config. It can be:
   * - `false` (or `undefined`, it's the default): do NOT use babel
   * - `true`: use babel using default babelrc file
   * - `path/to/.babelrc`: path to a babelrc file (<rootDir> can be used)
   * - `{...}`: an object with inline babel options
   *
   * @default undefined does NOT use babel
   */
  babelConfig?: boolean | string | BabelConfig

  // should this be kept in here? it has nothing to do with TS after all...
  /**
   * Kept for backward compatibility to handle __TRANSFORM_HTML__
   * Any file which will match this regex will be transpiled as a module
   * exporting the content of the file as a string
   */
  stringifyContentPathRegex?: string | RegExp

  /**
   * Tell `ts-jest` to transform codes to ESM format. This only works in combination with `jest-runtime` ESM option
   * `supportsStaticESM` true which is passed into Jest transformer
   */
  useESM?: boolean
}

/**
 * For transformers which extends `ts-jest`
 * @deprecated use `JestConfigWithTsJest` instead
 */
export interface ProjectConfigTsJest extends Config.ProjectConfig {
  globals: GlobalConfigTsJest
}
/**
 * @deprecated use `JestConfigWithTsJest` instead
 */
export interface TransformOptionsTsJest<TransformerConfig = unknown> extends TransformOptions<TransformerConfig> {
  config: Config.ProjectConfig
}

/**
 * For typings in `jest.config.ts`
 * @deprecated use `JestConfigWithTsJest` instead
 */
export interface GlobalConfigTsJest extends Config.ConfigGlobals {
  'ts-jest'?: TsJestGlobalOptions
}
/**
 * @deprecated use `JestConfigWithTsJest` instead
 */
export interface InitialOptionsTsJest extends Config.InitialOptions {
  globals?: GlobalConfigTsJest
}
export type TsJestTransformerOptions = TsJestGlobalOptions

export type TsJestTransformOptions = TransformOptions<TsJestTransformerOptions>

export interface JestConfigWithTsJest extends Omit<Config.InitialOptions, 'transform'> {
  transform?: {
    [regex: string]:
      | 'ts-jest'
      | 'ts-jest/legacy'
      | ['ts-jest', TsJestTransformerOptions]
      | ['ts-jest/legacy', TsJestTransformerOptions]
      | string
      | Config.TransformerConfig
  }
}

export type StringMap = Map<string, string>
export interface DepGraphInfo {
  fileContent: string
  resolvedModuleNames: string[]
}

export interface TsJestCompileOptions {
  depGraphs: Map<string, DepGraphInfo>
  watchMode: boolean
  supportsStaticESM: boolean
}

export interface CompiledOutput extends TransformedSource {
  diagnostics?: _ts.Diagnostic[]
}

export interface CompilerInstance {
  getResolvedModules(fileContent: string, fileName: string, runtimeCacheFS: StringMap): string[]
  getCompiledOutput(fileContent: string, fileName: string, options: TsJestCompileOptions): CompiledOutput
}
export interface TsCompilerInstance extends CompilerInstance {
  configSet: ConfigSet
  program: _ts.Program | undefined
}

export interface AstTransformerDesc<T = Record<string, unknown>> {
  name: string
  version: number
  factory(
    tsCompiler: TsCompilerInstance,
    opts?: T,
  ): _ts.TransformerFactory<_ts.SourceFile> | _ts.TransformerFactory<_ts.Bundle | _ts.SourceFile>
  options?: T
}

export interface TsJestAstTransformer {
  before: AstTransformerDesc[]
  after: AstTransformerDesc[]
  afterDeclarations: AstTransformerDesc[]
}

/**
 * @deprecated use other preset types below instead
 */
export type TsJestPresets = Pick<
  JestConfigWithTsJest,
  'extensionsToTreatAsEsm' | 'moduleFileExtensions' | 'transform' | 'testMatch'
>

export type DefaultTransformOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type DefaultPreset = {
  transform: {
    [TS_TRANSFORM_PATTERN]: ['ts-jest', DefaultTransformOptions]
  }
}
export type DefaultLegacyPreset = {
  transform: {
    [TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', DefaultTransformOptions]
  }
}

export type DefaultEsmTransformOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type DefaultEsmPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & DefaultEsmTransformOptions]
  }
}
export type DefaultEsmLegacyPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', { useESM: true } & DefaultEsmTransformOptions]
  }
}

export type JsWithTsTransformOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type JsWithTsPreset = {
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: ['ts-jest', JsWithTsTransformOptions]
  }
}
export type JsWithTsLegacyPreset = {
  transform: {
    [TS_JS_TRANSFORM_PATTERN]: ['ts-jest/legacy', JsWithTsTransformOptions]
  }
}

export type JsWithTsEsmTransformOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type JsWithTsEsmPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & JsWithTsEsmTransformOptions]
  }
}
export type JsWithTsEsmLegacyPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_TS_JS_TRANSFORM_PATTERN]: ['ts-jest/legacy', { useESM: true } & JsWithTsEsmTransformOptions]
  }
}

export type JsWithBabelTransformerOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type JsWithBabelPreset = {
  transform: {
    [JS_TRANSFORM_PATTERN]: 'babel-jest'
    [TS_TRANSFORM_PATTERN]: ['ts-jest', JsWithBabelTransformerOptions]
  }
}
export type JsWithBabelLegacyPreset = {
  transform: {
    [JS_TRANSFORM_PATTERN]: 'babel-jest'
    [TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', JsWithBabelTransformerOptions]
  }
}

export type JsWithBabelEsmTransformOptions = Omit<TsJestTransformerOptions, 'useESM'>
export type JsWithBabelEsmPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_JS_TRANSFORM_PATTERN]: 'babel-jest'
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest', { useESM: true } & JsWithBabelEsmTransformOptions]
  }
}
export type JsWithBabelEsmLegacyPreset = {
  extensionsToTreatAsEsm: string[]
  transform: {
    [ESM_JS_TRANSFORM_PATTERN]: 'babel-jest'
    [ESM_TS_TRANSFORM_PATTERN]: ['ts-jest/legacy', { useESM: true } & JsWithBabelEsmTransformOptions]
  }
}

declare module '@jest/types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Config {
    interface ConfigGlobals {
      /**
       * strangely `@ts-expect-error` doesn't work in this case when running
       * `npm run build` vs `npm run pretest`
       */
      // eslint-disable-next-line
      // @ts-ignore
      'ts-jest'?: TsJestTransformerOptions
    }
  }
}
