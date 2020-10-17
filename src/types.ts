import type { Transformer } from '@jest/transform'
import type * as _babel from 'babel__core'
import type * as _ts from 'typescript'

import type { ConfigSet } from './config/config-set'

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
   * @alias tsconfig
   */
  tsConfig?: boolean | string | _ts.CompilerOptions

  /**
   * Compiler options. It can be:
   * - `true` (or `undefined`, it's the default): use default tsconfig file
   * - `false`: do NOT use default config file
   * - `path/to/tsconfig.json`: path to a specific tsconfig file (<rootDir> can be used)
   * - `{...}`: an object with inline compiler options
   *
   * @default undefined uses the default tsconfig file
   * @alias tsConfig
   */
  tsconfig?: boolean | string | _ts.CompilerOptions

  /**
   * packageJson. It can be:
   * - `true` (or `undefined`, it's the default): use default package.json file
   * - `path/to/package.json`: path to a specific package.json file (<rootDir> can be used)
   * - `{...}`: contents of a package.json
   *
   * @default undefined uses the default package.json file
   */
  packageJson?: boolean | string | Record<string, unknown>

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
  astTransformers?: string[] | ConfigCustomTransformer

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
interface TsJestConfig$diagnostics {
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
type TsJestConfig$stringifyContentPathRegex = string | undefined
/**
 * @internal
 */
export interface TsJestConfig {
  tsConfig: TsJestConfig$tsConfig
  isolatedModules: boolean
  compiler: string
  diagnostics: TsJestConfig$diagnostics
  babelConfig: TsJestConfig$babelConfig
  transformers: ConfigCustomTransformer
  // to deprecate / deprecated === === ===
  stringifyContentPathRegex: TsJestConfig$stringifyContentPathRegex
}

export interface TsCompiler {
  /**
   * @internal
   */
  cwd: string
  /**
   * @internal
   */
  compile(code: string, fileName: string, lineOffset?: number): string
  program: _ts.Program | undefined
}
/**
 * Internal source output.
 *
 * @internal
 */
export type SourceOutput = [string, string]
/**
 * @internal
 */
export type CompileFn = (code: string, fileName: string, lineOffset?: number) => SourceOutput
/**
 * @internal
 */
export interface CompilerInstance {
  compileFn: CompileFn
  program: _ts.Program | undefined
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
