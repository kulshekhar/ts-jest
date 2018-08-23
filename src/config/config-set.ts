/**
 * This is the core of settings and so ts-jest.
 * Since configuration are used to create a good cache key, everything
 * depending on it is here. Fast jest relies on correct cache keys
 * depending on all settings that could affect the generated output.
 *
 * The big issue is that jest calls first `getCacheKey()` with stringified
 * version of the `jest.ProjectConfig`, and then later it calls `process()`
 * with the complete, object version of it.
 */
import { JsonableValue } from '../util/jsonable-value'
import {
  BabelConfig,
  TsJestConfig,
  TsJestGlobalOptions,
  TTypeScript,
  TsJestHooksMap,
  BabelJestTransformer,
  TsCompiler,
} from '../types'
import { resolve, isAbsolute, join, dirname } from 'path'
import { Memoize } from '../util/memoize'
import { backportJestConfig } from '../util/backports'
import { Errors, ImportReasons, interpolate } from '../util/messages'
import json5 from 'json5'
import { existsSync, readFileSync } from 'fs'
import { importer } from '../util/importer'
import {
  Diagnostic,
  FormatDiagnosticsHost,
  ParsedCommandLine,
} from 'typescript'
import { TSError } from '../util/ts-error'
import { sha1 } from '../util/sha1'
import { stringify } from '../util/json'
import { normalizeSlashes } from '../util/normalize-slashes'
import { createCompiler } from '../compiler'
import { version as myVersion } from '..'
import semver from 'semver'

interface ReadTsConfigResult {
  // what we get from reading the config file if any, or inline options
  input?: any
  // parsed config with all resolved options
  resolved: ParsedCommandLine
}

// this regex MUST match nothing, it's the goal ;-)
export const MATCH_NOTHING = /a^/
export const IGNORE_DIAGNOSTIC_CODES = [
  6059, // "'rootDir' is expected to contain all source files."
  18002, // "The 'files' list in config file is empty."
  18003, // "No inputs were found in config file."
]

const DEFAULT_COMPILER_OPTIONS = {
  inlineSourceMap: true,
  inlineSources: true,
}
const FORCE_COMPILER_OPTIONS = {
  // we handle sourcemaps this way and not another
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
  // we don't want to create declaration files
  declaration: false,
  noEmit: false,
  outDir: '$$ts-jest$$',
  // commonjs + module interop should be compatible with every other setup
  module: 'commonjs',
  esModuleInterop: true,
  // else istanbul related will be dropped
  removeComments: false,
  // to clear out else it's buggy
  out: undefined,
  outFile: undefined,
  composite: undefined,
  declarationDir: undefined,
  declarationMap: undefined,
  emitDeclarationOnly: undefined,
  sourceRoot: undefined,
}

const normalizeRegex = (
  pattern: string | RegExp | undefined,
): string | undefined => {
  return pattern
    ? typeof pattern === 'string'
      ? pattern
      : pattern.source
    : undefined
}

const toDiagnosticCode = (code: any): number | undefined => {
  return code
    ? parseInt(('' + code).trim().replace(/^TS/, ''), 10) || undefined
    : undefined
}

const toDiagnosticCodeList = (items: any, into: number[] = []): number[] => {
  if (!Array.isArray(items)) items = [items]
  for (let item of items) {
    if (!item) continue
    if (Array.isArray(item)) {
      toDiagnosticCodeList(item, into)
      continue
    } else if (typeof item === 'string') {
      const children = item.trim().split(/\s*,\s*/g)
      if (children.length > 1) {
        toDiagnosticCodeList(children, into)
        continue
      }
      item = children[0]
    }
    if (!item) continue
    const code = toDiagnosticCode(item)
    if (code && !into.includes(code)) into.push(code)
  }
  return into
}

export class ConfigSet {
  constructor(
    private _jestConfig: jest.ProjectConfig,
    readonly parentOptions?: TsJestGlobalOptions,
  ) {}

  @Memoize()
  get jest(): jest.ProjectConfig {
    const config = backportJestConfig(this._jestConfig)
    if (this.parentOptions) {
      const globals: any = config.globals || (config.globals = {})
      // TODO: implement correct deep merging instead
      globals['ts-jest'] = {
        ...this.parentOptions,
        ...globals['ts-jest'],
      }
    }
    return config
  }

  @Memoize()
  get tsJest(): TsJestConfig {
    const parsedConfig = this.jest
    const { globals = {} } = parsedConfig as any
    const options: TsJestGlobalOptions = { ...globals['ts-jest'] }

    // tsconfig
    const { tsConfig: tsConfigOpt } = options
    let tsConfig: TsJestConfig['tsConfig']
    if (
      typeof tsConfigOpt === 'string' ||
      tsConfigOpt == null ||
      tsConfigOpt === true
    ) {
      tsConfig = {
        kind: 'file',
        value:
          typeof tsConfigOpt === 'string'
            ? this.resolvePath(tsConfigOpt)
            : undefined,
      }
    } else if (typeof tsConfigOpt === 'object') {
      tsConfig = {
        kind: 'inline',
        value: tsConfigOpt,
      }
    }

    // babel jest
    const { babelConfig: babelConfigOpt } = options
    let babelConfig: TsJestConfig['babelConfig']
    if (typeof babelConfigOpt === 'string' || babelConfigOpt === true) {
      babelConfig = {
        kind: 'file',
        value:
          babelConfigOpt === true
            ? undefined
            : this.resolvePath(babelConfigOpt as string),
      }
    } else if (babelConfigOpt) {
      babelConfig = {
        kind: 'inline',
        value: babelConfigOpt,
      }
    }

    // diagnostics
    let diagnostics: TsJestConfig['diagnostics']
    const { diagnostics: diagnosticsOpt = true } = options
    // messy list of stuff to ignore (will be casted later)
    const ignoreList: any[] = [
      IGNORE_DIAGNOSTIC_CODES,
      process.env.TS_JEST_IGNORE_DIAGNOSTICS,
    ]

    if (diagnosticsOpt === true || diagnosticsOpt == null) {
      diagnostics = { ignoreCodes: [], pretty: true }
    } else if (diagnosticsOpt === false) {
      diagnostics = {
        pretty: true,
        ignoreCodes: [],
        pathRegex: MATCH_NOTHING.source, // matches nothing
      }
    } else {
      ignoreList.push(diagnosticsOpt.ignoreCodes)
      diagnostics = {
        pretty: diagnosticsOpt.pretty == null ? true : !!diagnosticsOpt.pretty,
        ignoreCodes: [],
        pathRegex: normalizeRegex(diagnosticsOpt.pathRegex),
      }
    }
    // now we clean and flaten the list
    diagnostics.ignoreCodes = toDiagnosticCodeList(ignoreList)

    // stringifyContentPathRegex option
    const stringifyContentPathRegex = normalizeRegex(
      options.stringifyContentPathRegex,
    )

    // parsed options
    return {
      tsConfig,
      babelConfig,
      diagnostics,
      typeCheck: !!options.typeCheck,
      compiler: options.compiler || 'typescript',
      stringifyContentPathRegex,
    }
  }

  get typescript(): ParsedCommandLine {
    return this._typescript.resolved
  }

  get tsconfig(): any {
    return this._typescript.input
  }

  @Memoize()
  private get _typescript(): ReadTsConfigResult {
    const {
      tsJest: { tsConfig },
    } = this
    const result = this.readTsConfig(
      tsConfig && tsConfig.kind === 'inline' ? tsConfig.value : undefined,
      tsConfig && tsConfig.kind === 'file' ? tsConfig.value : undefined,
      tsConfig == null,
    )
    // throw errors if any matching wanted diagnostics
    const configDiagnosticList = this.filterDiagnostics(result.resolved.errors)
    if (configDiagnosticList.length) {
      throw this.createTsError(configDiagnosticList)
    }
    return result
  }

  @Memoize()
  get babel(): BabelConfig | undefined {
    const {
      tsJest: { babelConfig },
    } = this
    if (babelConfig == null) return
    let base: BabelConfig = { cwd: this.cwd }
    if (babelConfig.kind === 'file') {
      if (babelConfig.value) {
        base = {
          ...base,
          ...json5.parse(readFileSync(babelConfig.value, 'utf8')),
        }
      }
    } else if (babelConfig.kind === 'inline') {
      base = { ...base, ...babelConfig.value }
    }

    // loadOptions is from babel 7+, and OptionManager is backward compatible but deprecated 6 API
    const { OptionManager, loadOptions, version } = importer.babelCore(
      ImportReasons.BabelJest,
    )
    // cwd is only supported from babel >= 7
    if (version && semver.satisfies(version, '>=6 <7')) {
      delete base.cwd
    }
    // call babel to load options
    let config: BabelConfig
    if (typeof loadOptions === 'function') {
      config = loadOptions(base) as BabelConfig
    } else {
      config = new OptionManager().init(base) as BabelConfig
    }

    return config
  }

  @Memoize()
  get compilerModule(): TTypeScript {
    return importer.typescript(ImportReasons.TsJest, this.tsJest.compiler)
  }

  @Memoize()
  get babelJestTransformer(): BabelJestTransformer | undefined {
    const { babel } = this
    if (!babel) return
    return importer
      .babelJest(ImportReasons.BabelJest)
      .createTransformer(babel) as BabelJestTransformer
  }

  @Memoize()
  get tsCompiler(): TsCompiler {
    return createCompiler(this)
  }

  @Memoize()
  get hooks(): TsJestHooksMap {
    let hooksFile = process.env.TS_JEST_HOOKS
    if (hooksFile) {
      hooksFile = resolve(this.cwd, hooksFile)
      return importer.tryThese(hooksFile) || {}
    }
    return {}
  }

  @Memoize()
  get filterDiagnostics() {
    const {
      tsJest: {
        diagnostics: { ignoreCodes },
      },
      shouldReportDiagnostic,
    } = this
    return (diagnostics: Diagnostic[], filePath?: string): Diagnostic[] => {
      if (filePath && !shouldReportDiagnostic(filePath)) return []
      return diagnostics.filter(diagnostic => {
        if (
          diagnostic.file &&
          diagnostic.file.fileName &&
          !shouldReportDiagnostic(diagnostic.file.fileName)
        ) {
          return false
        }
        return ignoreCodes.indexOf(diagnostic.code) === -1
      })
    }
  }

  @Memoize()
  get shouldReportDiagnostic(): (filePath: string) => boolean {
    const {
      diagnostics: { pathRegex },
    } = this.tsJest
    if (pathRegex) {
      const regex = new RegExp(pathRegex)
      return file => regex.test(file)
    } else {
      return () => true
    }
  }

  @Memoize()
  get shouldStringifyContent(): (filePath: string) => boolean {
    const { stringifyContentPathRegex } = this.tsJest
    if (stringifyContentPathRegex) {
      const regex = new RegExp(stringifyContentPathRegex)
      return file => regex.test(file)
    } else {
      return () => false
    }
  }

  @Memoize()
  get createTsError() {
    const {
      diagnostics: { pretty },
    } = this.tsJest

    const formatDiagnostics = pretty
      ? this.compilerModule.formatDiagnosticsWithColorAndContext
      : this.compilerModule.formatDiagnostics

    const diagnosticHost: FormatDiagnosticsHost = {
      getNewLine: () => '\n',
      getCurrentDirectory: () => this.cwd,
      getCanonicalFileName: path => path,
    }

    return (diagnostics: ReadonlyArray<Diagnostic>) => {
      const diagnosticText = formatDiagnostics(diagnostics, diagnosticHost)
      const diagnosticCodes = diagnostics.map(x => x.code)
      return new TSError(diagnosticText, diagnosticCodes)
    }
  }

  @Memoize()
  get tsCacheDir(): string | undefined {
    if (!this.jest.cache) return
    const cacheSufix = sha1(
      stringify({
        version: this.compilerModule.version,
        compiler: this.tsJest.compiler,
        compilerOptions: this.typescript.options,
        typeCheck: this.tsJest.typeCheck,
        ignoreDiagnostics: this.tsJest.diagnostics.ignoreCodes,
      }),
    )
    return join(this.jest.cacheDirectory, `ts-jest-${cacheSufix}`)
  }

  get rootDir(): string {
    return this.jest.rootDir || this.cwd
  }

  get cwd(): string {
    return this.jest.cwd || process.cwd()
  }

  get isDoctoring() {
    return !!process.env.TS_JEST_DOCTOR
  }

  readTsConfig(
    compilerOptions?: object,
    project?: string | null,
    noProject?: boolean | null,
  ): ReadTsConfigResult {
    let config = { compilerOptions: {} }
    let basePath = normalizeSlashes(this.cwd)
    let configFileName: string | undefined
    const ts = this.compilerModule
    let input: any

    if (noProject) {
      input = { compilerOptions: { ...compilerOptions } }
    } else {
      // Read project configuration when available.
      configFileName = project
        ? normalizeSlashes(resolve(this.cwd, project))
        : ts.findConfigFile(normalizeSlashes(this.cwd), ts.sys.fileExists)

      if (configFileName) {
        const result = ts.readConfigFile(configFileName, ts.sys.readFile)

        // Return diagnostics.
        if (result.error) {
          return {
            resolved: { errors: [result.error], fileNames: [], options: {} },
          }
        }

        config = result.config
        input = {
          ...result.config,
          compilerOptions: {
            ...(result.config && result.config.compilerOptions),
            ...compilerOptions,
          },
        }
        basePath = normalizeSlashes(dirname(configFileName))
      }
    }

    // Override default configuration options `ts-jest` requires.
    config.compilerOptions = {
      ...DEFAULT_COMPILER_OPTIONS,
      ...config.compilerOptions,
      ...compilerOptions,
      ...FORCE_COMPILER_OPTIONS,
    }

    const result = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      basePath,
      undefined,
      configFileName,
    )

    // Target ES5 output by default (instead of ES3).
    if (result.options.target === undefined) {
      result.options.target = ts.ScriptTarget.ES5
    }

    // ensure undefined in FORCE_COMPILER_OPTIONS are removed
    for (const key in FORCE_COMPILER_OPTIONS) {
      if ((FORCE_COMPILER_OPTIONS as any)[key] === undefined) {
        delete result.options[key]
      }
    }

    return { input, resolved: result }
  }

  resolvePath(inputPath: string, noFailIfMissing: boolean = false): string {
    let path: string = inputPath
    if (path.startsWith('<rootDir>')) {
      path = resolve(this.rootDir, path.substr(9))
    } else if (!isAbsolute(path)) {
      path = resolve(this.cwd, path)
    }
    if (!noFailIfMissing && !existsSync(path)) {
      throw new Error(
        interpolate(Errors.FileNotFound, { inputPath, resolvedPath: path }),
      )
    }
    return path
  }

  @Memoize()
  get jsonValue() {
    const jest = { ...this.jest }
    const globals = (jest.globals = { ...jest.globals } as any)
    // we need to remove some stuff from jest config
    // this which does not depend on config
    delete jest.name
    delete jest.cacheDirectory
    // we do not need this since its normalized version is in tsJest
    delete globals['ts-jest']

    return new JsonableValue({
      version: myVersion,
      jest,
      tsJest: this.tsJest,
      babel: this.babel,
      tsconfig: this.tsconfig,
    })
  }

  get cacheKey(): string {
    return this.jsonValue.serialized
  }

  toJSON() {
    return this.jsonValue.value
  }
}
