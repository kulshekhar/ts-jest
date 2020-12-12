import type { Transformer, TransformOptions } from '@jest/transform'
import type { Config } from '@jest/types'
import type * as _babel from 'babel__core'
import type * as _ts from 'typescript'

import type { ConfigSet } from './config/config-set'

declare module '@jest/types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Config {
    interface ConfigGlobals {
      'ts-jest': TsJestGlobalOptions
    }
  }
}

/**
 * @internal
 */
export type TBabelCore = typeof _babel
export type TTypeScript = typeof _ts
/**
 * @internal
 */
export type TBabelJest = Required<Transformer>
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
  before?: (string | AstTransformer)[]
  after?: (string | AstTransformer)[]
  afterDeclarations?: (string | AstTransformer)[]
}

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
  tsconfig?: boolean | string | _ts.CompilerOptions

  /**
   * Compiles files as isolated modules (disables some features and type-checking)
   *
   * @default undefined (disabled)
   */
  isolatedModules?: boolean

  /**
   * Compiler to use
   *
   * @default 'typescript'
   */
  compiler?: string

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
        ignoreCodes?: number | string | (number | string)[]
        /**
         * If specified, diagnostics of source files which path does **not** match
         * will be ignored
         */
        pathRegex?: RegExp | string
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
}

interface TsJestConfig$tsConfig$file {
  kind: 'file'
  value: string | undefined
}
interface TsJestConfig$tsConfig$inline {
  kind: 'inline'
  value: _ts.CompilerOptions
}
type TsJestConfig$tsConfig = TsJestConfig$tsConfig$file | TsJestConfig$tsConfig$inline | undefined
export interface TsJestDiagnosticsCfg {
  pretty: boolean
  ignoreCodes: number[]
  pathRegex?: string | undefined
  throws: boolean
  warnOnly?: boolean
}
interface TsJestConfig$babelConfig$file {
  kind: 'file'
  value: string | undefined
}
interface TsJestConfig$babelConfig$inline {
  kind: 'inline'
  value: BabelConfig
}
type TsJestConfig$babelConfig = TsJestConfig$babelConfig$file | TsJestConfig$babelConfig$inline | undefined
/**
 * @internal
 */
export interface TsJestConfig {
  tsconfig: TsJestConfig$tsConfig
  isolatedModules: boolean
  compiler: string
  diagnostics: TsJestDiagnosticsCfg
  babelConfig: TsJestConfig$babelConfig
  transformers: ConfigCustomTransformer
  // to deprecate / deprecated === === ===
  stringifyContentPathRegex: string | undefined
}

export interface TsJestProjectConfig extends Config.ProjectConfig {
  globals: {
    'ts-jest': TsJestGlobalOptions
  }
}

export interface TransformOptionsTsJest extends TransformOptions {
  config: TsJestProjectConfig
}

export type ResolvedModulesMap = Map<string, _ts.ResolvedModuleFull | undefined> | undefined
/**
 * @internal
 */
export type StringMap = Map<string, string>

export interface CompilerInstance {
  getResolvedModulesMap(fileContent: string, fileName: string): ResolvedModulesMap
  getCompiledOutput(fileContent: string, fileName: string): string
}
/**
 * @internal
 */
export interface AstTransformerDesc<T = Record<string, unknown>> {
  name: string
  version: number
  factory(
    cs: ConfigSet,
    opts?: T,
  ): _ts.TransformerFactory<_ts.SourceFile> | _ts.TransformerFactory<_ts.Bundle | _ts.SourceFile>
}
