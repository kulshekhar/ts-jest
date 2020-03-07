import { TransformedSource, Transformer } from '@jest/transform/build/types'
import * as _babel from 'babel__core'
import { CompilerOptions, SourceFile, TransformerFactory } from 'typescript'
// tslint:disable-next-line:no-duplicate-imports
import * as _ts from 'typescript'

import { ConfigSet } from './config/config-set'

export type TBabelCore = typeof _babel
export type TTypeScript = typeof _ts
export type TBabelJest = Required<Transformer>
export type BabelJestTransformer = {
  [K in Exclude<keyof Transformer, 'createTransformer'>]: Exclude<Transformer[K], undefined>
}
export type BabelConfig = _babel.TransformOptions

export interface TsJestGlobalOptions {
  /**
   * Compiler options. It can be:
   *     - `true` (or `undefined`, it's the default): use default tsconfig file
   *     - `false`: do NOT use default config file
   *     - `path/to/tsconfig.json`: path to a specific tsconfig file (<rootDir> can be used)
   *     - `{...}`: an object with inline compiler options
   */
  tsConfig?: boolean | string | CompilerOptions

  /**
   * packageJson. It can be:
   *     - `true` (or `undefined`, it's the default): use default package.json file
   *     - `path/to/package.json`: path to a specific package.json file (<rootDir> can be used)
   *     - `{...}`: contents of a package.json
   */
  packageJson?: boolean | string | object

  /**
   * Whether to compile files as isolated modules (disables some features and type-checking, default to `false`):
   */
  isolatedModules?: boolean

  /**
   * Use TypeScript's compiler host API.
   *
   * @default false
   */
  compilerHost?: boolean

  /**
   * Use TypeScript's Incremental Program. This option only works when `compilerHost` is `true`
   * TODO: Remove this flag when we can make project references working with our Incremental Program
   * @default false
   */
  incremental?: boolean

  /**
   * Emit compiled files into `.ts-jest` directory
   *
   * @default false
   */
  emit?: boolean

  /**
   * Compiler to use (default to 'typescript'):
   */
  compiler?: string

  /**
   * Custom transformers (mostly used by jest presets)
   */
  astTransformers?: string[]

  /**
   * TS diagnostics - less to be reported if `isolatedModules` is `true`. It can be:
   *     - `true` (or `undefined`, it's the default): show all diagnostics
   *     - `false`: hide diagnostics of all files (kind of useless)
   *     - `{...}`: an inline object with fine grained settings
   */
  diagnostics?:
    | boolean
    | {
        pretty?: boolean
        /**
         * Ignore TypeScript warnings by diagnostic code.
         */
        ignoreCodes?: number | string | (number | string)[]
        pathRegex?: RegExp | string
        /**
         * Logs TypeScript errors to stderr instead of throwing exceptions.
         *
         * @default false
         */
        warnOnly?: boolean
      }

  /**
   * Babel config. It can be:
   *    - `false` (or `undefined`, it's the default): do NOT use babel
   *    - `true`: use babel using default babelrc file
   *    - `path/to/.babelrc`: path to a babelrc file (<rootDir> can be used)
   *     - `{...}`: an object with inline babel options
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
  value: CompilerOptions
}
type TsJestConfig$tsConfig = TsJestConfig$tsConfig$file | TsJestConfig$tsConfig$inline | undefined
interface TsJestConfig$diagnostics {
  pretty: boolean
  ignoreCodes: number[]
  pathRegex?: string | undefined
  throws: boolean
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
interface TsJestConfig$packageJson$file {
  kind: 'file'
  value: string | undefined
}
interface TsJestConfig$packageJson$inline {
  kind: 'inline'
  value: any
}
type TsJestConfig$packageJson = TsJestConfig$packageJson$file | TsJestConfig$packageJson$inline | undefined
type TsJestConfig$stringifyContentPathRegex = string | undefined

export interface TsJestConfig {
  tsConfig: TsJestConfig$tsConfig
  packageJson: TsJestConfig$packageJson
  isolatedModules: boolean
  compilerHost: boolean
  incremental: boolean // TODO: Remove this flag when we can make project references working with our Incremental Program
  emit: boolean
  compiler: string
  diagnostics: TsJestConfig$diagnostics
  babelConfig: TsJestConfig$babelConfig
  transformers: string[]
  // to deprecate / deprecated === === ===
  stringifyContentPathRegex: TsJestConfig$stringifyContentPathRegex
}

export interface TsJestHooksMap {
  afterProcess?(args: any[], result: string | TransformedSource): string | TransformedSource | void
}

/**
 * @internal
 */
export type ModulePatcher<T = any> = (module: T) => T

/**
 * Common TypeScript interfaces between versions.
 */
export interface TSCommon {
  version: typeof _ts.version
  sys: typeof _ts.sys
  ScriptSnapshot: typeof _ts.ScriptSnapshot
  displayPartsToString: typeof _ts.displayPartsToString
  createLanguageService: typeof _ts.createLanguageService
  getDefaultLibFilePath: typeof _ts.getDefaultLibFilePath
  getPreEmitDiagnostics: typeof _ts.getPreEmitDiagnostics
  flattenDiagnosticMessageText: typeof _ts.flattenDiagnosticMessageText
  transpileModule: typeof _ts.transpileModule
  ModuleKind: typeof _ts.ModuleKind
  ScriptTarget: typeof _ts.ScriptTarget
  findConfigFile: typeof _ts.findConfigFile
  readConfigFile: typeof _ts.readConfigFile
  parseJsonConfigFileContent: typeof _ts.parseJsonConfigFileContent
  formatDiagnostics: typeof _ts.formatDiagnostics
  formatDiagnosticsWithColorAndContext: typeof _ts.formatDiagnosticsWithColorAndContext
}

export interface TsCompiler {
  cwd: string
  extensions: string[]
  cachedir: string | undefined
  ts: TSCommon
  compile(code: string, fileName: string, lineOffset?: number): string
}

/**
 * Internal source output.
 */
export type SourceOutput = [string, string]

/**
 * Track the project information.
 * @internal
 */
export interface MemoryCache {
  contents: Map<string, string | undefined>
  versions: Map<string, number>
  outputs: Map<string, string>
}

export type CompileResult = (code: string, fileName: string, lineOffset?: number) => SourceOutput

export interface AstTransformerDesc {
  name: string
  version: number
  factory(cs: ConfigSet): TransformerFactory<SourceFile>
}
