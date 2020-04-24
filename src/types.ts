import { TransformedSource, Transformer } from '@jest/transform'
import * as _babel from 'babel__core'
import * as _ts from 'typescript'

import { ConfigSet } from './config/config-set'

/**
 * @internal
 */
export type TBabelCore = typeof _babel
/**
 * @internal
 */
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
 * @internal
 */
export type BabelConfig = _babel.TransformOptions

export interface TsJestGlobalOptions {
  /**
   * Compiler options. It can be:
   * - `true` (or `undefined`, it's the default): use default tsconfig file
   * - `false`: do NOT use default config file
   * - `path/to/tsconfig.json`: path to a specific tsconfig file (<rootDir> can be used)
   * - `{...}`: an object with inline compiler options
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
   * @default undefined uses the default tsconfig file
   * @alias tsConfig
   */
  tsconfig?: boolean | string | _ts.CompilerOptions

  /**
   * packageJson. It can be:
   * - `true` (or `undefined`, it's the default): use default package.json file
   * - `path/to/package.json`: path to a specific package.json file (<rootDir> can be used)
   * - `{...}`: contents of a package.json
   * @default undefined uses the default package.json file
   */
  packageJson?: boolean | string | object

  /**
   * Compiles files as isolated modules (disables some features and type-checking)
   * @default undefined (disabled)
   */
  isolatedModules?: boolean

  /**
   * Compiler to use
   * @default 'typescript'
   */
  compiler?: string

  /**
   * Custom transformers (mostly used by jest presets)
   */
  astTransformers?: string[]

  /**
   * TS diagnostics - less to be reported if `isolatedModules` is `true`. It can be:
   * - `true` (or `undefined`, it's the default): show all diagnostics
   * - `false`: hide diagnostics of all files (kind of useless)
   * - `{...}`: an inline object with fine grained settings
   * @default undefined shows all diagnostics
   */
  diagnostics?:
    | boolean
    | {
        /**
         * Enables colorful and pretty output of errors
         * @default undefined (enabled)
         */
        pretty?: boolean
        /**
         * List of TypeScript diagnostic error codes to ignore
         * [here](https://github.com/Microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json).
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
  compiler: string
  diagnostics: TsJestConfig$diagnostics
  babelConfig: TsJestConfig$babelConfig
  transformers: string[]
  // to deprecate / deprecated === === ===
  stringifyContentPathRegex: TsJestConfig$stringifyContentPathRegex
}
/**
 * @internal
 */
export interface TsJestHooksMap {
  afterProcess?(args: any[], result: string | TransformedSource): string | TransformedSource | void
}

/**
 * @internal
 */
export type ModulePatcher<T = any> = (module: T) => T

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
 * @internal
 */
export type SourceOutput = [string, string]

/**
 * Track the project information.
 * @internal
 */
export interface MemoryCache {
  resolvedModules: {
    [testFilePath: string]: {
      testFileContent: string
      modulePaths: string[]
    }
  }
  files: TSFiles
}
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
export interface AstTransformerDesc {
  name: string
  version: number
  factory(cs: ConfigSet): _ts.TransformerFactory<_ts.SourceFile>
}
/** where key is filepath */
export interface TSFiles {
  [filePath: string]: TSFile
}
export interface TSFile {
  text?: string
  output?: string
  version: number
  projectReference?: {
    /**
     * Undefined here means we’ve already checked and confirmed there is no
     * project reference for the file. Don’t bother checking again.
     */
    project?: _ts.ResolvedProjectReference
    outputFileName?: string
  }
}
