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
import { LogContexts, Logger } from 'bs-logger'
import { existsSync, readFileSync, realpathSync } from 'fs'
import json5 from 'json5'
import { dirname, isAbsolute, join, normalize, resolve } from 'path'
import semver from 'semver'
import {
  CompilerOptions,
  CustomTransformers,
  Diagnostic,
  DiagnosticCategory,
  FormatDiagnosticsHost,
  ParsedCommandLine,
  SourceFile,
} from 'typescript'

import { digest as MY_DIGEST, version as MY_VERSION } from '..'
import { createCompiler } from '../compiler'
import { internals as internalAstTransformers } from '../transformers'
import {
  AstTransformerDesc,
  BabelConfig,
  BabelJestTransformer,
  TTypeScript,
  TsCompiler,
  TsJestConfig,
  TsJestGlobalOptions,
  TsJestHooksMap,
} from '../types'
import { backportJestConfig } from '../util/backports'
import { getPackageVersion } from '../util/get-package-version'
import { importer } from '../util/importer'
import { stringify } from '../util/json'
import { JsonableValue } from '../util/jsonable-value'
import { rootLogger } from '../util/logger'
import { Memoize } from '../util/memoize'
import { Errors, ImportReasons, interpolate } from '../util/messages'
import { normalizeSlashes } from '../util/normalize-slashes'
import { sha1 } from '../util/sha1'
import { TSError } from '../util/ts-error'

const logger = rootLogger.child({ namespace: 'config' })

interface ReadTsConfigResult {
  // what we get from reading the config file if any, or inline options
  input?: any
  // parsed config with all resolved options
  resolved: ParsedCommandLine
}

/**
 * @internal
 */
// this regex MUST match nothing, it's the goal ;-)
export const MATCH_NOTHING = /a^/
/**
 * @internal
 */
export const IGNORE_DIAGNOSTIC_CODES = [
  6059, // "'rootDir' is expected to contain all source files."
  18002, // "The 'files' list in config file is empty."
  18003, // "No inputs were found in config file."
]

/**
 * @internal
 */
// WARNING: DO NOT CHANGE THE ORDER OF CODE NAMES!
// ONLY APPEND IF YOU NEED TO ADD SOME
export enum DiagnosticCodes {
  TsJest = 151000,
  ConfigModuleOption,
}

const normalizeRegex = (pattern: string | RegExp | undefined): string | undefined => {
  return pattern ? (typeof pattern === 'string' ? pattern : pattern.source) : undefined
}

const toDiagnosticCode = (code: any): number | undefined => {
  return code ? parseInt(`${code}`.trim().replace(/^TS/, ''), 10) || undefined : undefined
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
  @Memoize()
  get projectPackageJson(): Record<string, any> {
    const tsJestRoot = resolve(__dirname, '..', '..')
    let pkgPath = resolve(tsJestRoot, '..', '..', 'package.json')
    let exists = existsSync(pkgPath)
    if (!exists) {
      if (realpathSync(this.rootDir) === realpathSync(tsJestRoot)) {
        pkgPath = resolve(tsJestRoot, 'package.json')
        exists = true
      } else {
        this.logger.warn(Errors.UnableToFindProjectRoot)
      }
    }
    return exists ? require(pkgPath) : {}
  }

  @Memoize()
  get projectDependencies(): Record<string, string> {
    const { projectPackageJson: pkg } = this
    const names = Object.keys({
      ...pkg.optionalDependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
      ...pkg.dependencies,
    })
    return names.reduce(
      (map, name) => {
        const version = getPackageVersion(name)
        if (version) map[name] = version
        return map
      },
      {} as Record<string, string>,
    )
  }

  @Memoize()
  get jest(): jest.ProjectConfig {
    const config = backportJestConfig(this.logger, this._jestConfig)
    if (this.parentOptions) {
      const globals: any = config.globals || (config.globals = {})
      // TODO: implement correct deep merging instead
      globals['ts-jest'] = {
        ...this.parentOptions,
        ...globals['ts-jest'],
      }
    }
    this.logger.debug({ jestConfig: config }, 'normalized jest config')
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
    if (typeof tsConfigOpt === 'string' || tsConfigOpt == null || tsConfigOpt === true) {
      tsConfig = {
        kind: 'file',
        value: typeof tsConfigOpt === 'string' ? this.resolvePath(tsConfigOpt) : undefined,
      }
    } else if (typeof tsConfigOpt === 'object') {
      tsConfig = {
        kind: 'inline',
        value: tsConfigOpt,
      }
    }

    // transformers
    const transformers = (options.astTransformers || []).map(mod => this.resolvePath(mod, { nodeResolve: true }))

    // babel jest
    const { babelConfig: babelConfigOpt } = options
    let babelConfig: TsJestConfig['babelConfig']
    if (typeof babelConfigOpt === 'string' || babelConfigOpt === true) {
      babelConfig = {
        kind: 'file',
        value: babelConfigOpt === true ? undefined : this.resolvePath(babelConfigOpt as string),
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
    const ignoreList: any[] = [IGNORE_DIAGNOSTIC_CODES, process.env.TS_JEST_IGNORE_DIAGNOSTICS]

    if (diagnosticsOpt === true || diagnosticsOpt == null) {
      diagnostics = { ignoreCodes: [], pretty: true, throws: true }
    } else if (diagnosticsOpt === false) {
      diagnostics = {
        throws: false,
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
        throws: !diagnosticsOpt.warnOnly,
      }
    }
    // now we clean and flatten the list
    diagnostics.ignoreCodes = toDiagnosticCodeList(ignoreList)

    // stringifyContentPathRegex option
    const stringifyContentPathRegex = normalizeRegex(options.stringifyContentPathRegex)

    // parsed options
    const res: TsJestConfig = {
      tsConfig,
      babelConfig,
      diagnostics,
      isolatedModules: !!options.isolatedModules,
      compiler: options.compiler || 'typescript',
      transformers,
      stringifyContentPathRegex,
    }
    this.logger.debug({ tsJestConfig: res }, 'normalized ts-jest config')
    return res
  }

  get typescript(): ParsedCommandLine {
    return this._typescript.resolved
  }

  get tsconfig(): any {
    return this._typescript.input
  }

  @Memoize()
  get versions(): Record<string, string> {
    const modules = ['jest', this.tsJest.compiler]
    if (this.tsJest.babelConfig) {
      modules.push('@babel/core', 'babel-jest')
    }
    return modules.reduce(
      (map, name) => {
        map[name] = getPackageVersion(name) || '-'
        return map
      },
      { 'ts-jest': MY_VERSION } as Record<string, string>,
    )
  }

  /**
   * @internal
   */
  @Memoize()
  private get _typescript(): ReadTsConfigResult {
    const {
      tsJest: { tsConfig },
    } = this
    const configFilePath = tsConfig && tsConfig.kind === 'file' ? tsConfig.value : undefined
    const result = this.readTsConfig(
      tsConfig && tsConfig.kind === 'inline' ? tsConfig.value : undefined,
      configFilePath,
      tsConfig == null,
    )
    // throw errors if any matching wanted diagnostics
    this.raiseDiagnostics(result.resolved.errors, configFilePath)

    this.logger.debug({ tsconfig: result }, 'normalized typescript config')
    return result
  }

  /**
   * @internal
   */
  @Memoize()
  get raiseDiagnostics() {
    const {
      createTsError,
      filterDiagnostics,
      tsJest: {
        diagnostics: { throws },
      },
      compilerModule: { DiagnosticCategory },
    } = this
    return (diagnostics: Diagnostic[], filePath?: string, logger: Logger = this.logger): void | never => {
      const filteredDiagnostics = filterDiagnostics(diagnostics, filePath)
      if (filteredDiagnostics.length === 0) return
      const error = createTsError(filteredDiagnostics)
      // only throw if `warnOnly` and it is a warning or error
      const importantCategories = [DiagnosticCategory.Warning, DiagnosticCategory.Error]
      if (throws && filteredDiagnostics.some(d => importantCategories.includes(d.category))) {
        throw error
      }
      logger.warn({ error }, error.message)
    }
  }

  @Memoize()
  get babel(): BabelConfig | undefined {
    const {
      tsJest: { babelConfig },
    } = this
    if (babelConfig == null) {
      this.logger.debug('babel is disabled')
      return
    }
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
    const { OptionManager, loadOptions, version } = importer.babelCore(ImportReasons.BabelJest)
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

    this.logger.debug({ babelConfig: config }, 'normalized babel config')
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
    this.logger.debug('creating babel-jest transformer')
    return importer.babelJest(ImportReasons.BabelJest).createTransformer(babel) as BabelJestTransformer
  }

  @Memoize()
  get tsCompiler(): TsCompiler {
    return createCompiler(this)
  }

  @Memoize()
  get astTransformers(): AstTransformerDesc[] {
    return [...internalAstTransformers, ...this.tsJest.transformers.map(m => require(m))]
  }

  @Memoize()
  get tsCustomTransformers(): CustomTransformers {
    return {
      before: this.astTransformers.map(t => t.factory(this)),
    }
  }

  @Memoize()
  get hooks(): TsJestHooksMap {
    let hooksFile = process.env.TS_JEST_HOOKS
    if (hooksFile) {
      hooksFile = resolve(this.cwd, hooksFile)
      return importer.tryTheseOr(hooksFile, {})
    }
    return {}
  }

  /**
   * @internal
   */
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
        if (diagnostic.file && diagnostic.file.fileName && !shouldReportDiagnostic(diagnostic.file.fileName)) {
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

  /**
   * @internal
   */
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
    if (!this.jest.cache) {
      logger.debug('file caching disabled')
      return
    }
    const cacheSuffix = sha1(
      stringify({
        version: this.compilerModule.version,
        digest: this.tsJestDigest,
        dependencies: this.projectDependencies,
        compiler: this.tsJest.compiler,
        compilerOptions: this.typescript.options,
        isolatedModules: this.tsJest.isolatedModules,
        diagnostics: this.tsJest.diagnostics,
      }),
    )
    const res = join(this.jest.cacheDirectory, 'ts-jest', cacheSuffix.substr(0, 2), cacheSuffix.substr(2))
    logger.debug({ cacheDirectory: res }, 'will use file caching')
    return res
  }

  @Memoize()
  get overriddenCompilerOptions(): Partial<CompilerOptions> {
    const options: Partial<CompilerOptions> = {
      // we handle sourcemaps this way and not another
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: true,
      // we don't want to create declaration files
      declaration: false,
      noEmit: false,
      outDir: '$$ts-jest$$',
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
    // force the module kind if not piping babel-jest
    if (!this.tsJest.babelConfig) {
      // commonjs is required for jest
      options.module = this.compilerModule.ModuleKind.CommonJS
    }
    return options
  }

  @Memoize()
  get rootDir(): string {
    return normalize(this.jest.rootDir || this.cwd)
  }

  @Memoize()
  get cwd(): string {
    return normalize(this.jest.cwd || process.cwd())
  }

  /**
   * @internal
   */
  get isDoctoring() {
    return !!process.env.TS_JEST_DOCTOR
  }

  @Memoize()
  get tsJestDigest(): string {
    return MY_DIGEST
  }

  /**
   * @internal
   */
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
      versions: this.versions,
      projectDepVersions: this.projectDependencies,
      digest: this.tsJestDigest,
      transformers: this.astTransformers.map(t => `${t.name}@${t.version}`),
      jest,
      tsJest: this.tsJest,
      babel: this.babel,
      tsconfig: this.typescript.options,
    })
  }

  get cacheKey(): string {
    return this.jsonValue.serialized
  }
  readonly logger: Logger
  /**
   * @internal
   */
  private readonly _jestConfig: jest.ProjectConfig

  constructor(jestConfig: jest.ProjectConfig, readonly parentOptions?: TsJestGlobalOptions, parentLogger?: Logger) {
    this._jestConfig = jestConfig
    this.logger = parentLogger ? parentLogger.child({ [LogContexts.namespace]: 'config' }) : logger
  }

  /**
   * @internal
   */
  makeDiagnostic(
    code: number,
    messageText: string,
    options: { category?: DiagnosticCategory; file?: SourceFile; start?: number; length?: number } = {},
  ): Diagnostic {
    const { category = this.compilerModule.DiagnosticCategory.Warning, file, start, length } = options
    return {
      code,
      messageText,
      category,
      file,
      start,
      length,
    }
  }

  /**
   * @internal
   */
  readTsConfig(
    compilerOptions?: object,
    resolvedConfigFile?: string | null,
    noProject?: boolean | null,
  ): ReadTsConfigResult {
    let config = { compilerOptions: {} }
    let basePath = normalizeSlashes(this.rootDir)
    let configFileName: string | undefined
    const ts = this.compilerModule
    let input: any

    if (noProject) {
      input = { compilerOptions: { ...compilerOptions } }
    } else {
      // Read project configuration when available.
      configFileName = resolvedConfigFile
        ? normalizeSlashes(resolvedConfigFile)
        : ts.findConfigFile(normalizeSlashes(this.rootDir), ts.sys.fileExists)

      if (configFileName) {
        this.logger.debug({ tsConfigFileName: configFileName }, 'readTsConfig(): reading', configFileName)
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
      ...config.compilerOptions,
      ...compilerOptions,
    }

    // parse json, merge config extending others, ...
    const result = ts.parseJsonConfigFileContent(config, ts.sys, basePath, undefined, configFileName)

    const { overriddenCompilerOptions: forcedOptions } = this
    const finalOptions = result.options

    // Target ES5 output by default (instead of ES3).
    if (finalOptions.target === undefined) {
      finalOptions.target = ts.ScriptTarget.ES5
    }

    // check the module interoperability
    const target = finalOptions.target!
    // compute the default if not set
    const defaultModule = [ts.ScriptTarget.ES3, ts.ScriptTarget.ES5].includes(target)
      ? ts.ModuleKind.CommonJS
      : ts.ModuleKind.ESNext
    const moduleValue = finalOptions.module == null ? defaultModule : finalOptions.module
    if (
      'module' in forcedOptions &&
      moduleValue !== forcedOptions.module &&
      !(finalOptions.esModuleInterop || finalOptions.allowSyntheticDefaultImports)
    ) {
      result.errors.push(
        this.makeDiagnostic(DiagnosticCodes.ConfigModuleOption, Errors.ConfigNoModuleInterop, {
          category: ts.DiagnosticCategory.Message,
        }),
      )
      // at least enable synthetic default imports (except if it's set in the input config)
      if (!('allowSyntheticDefaultImports' in config.compilerOptions)) {
        finalOptions.allowSyntheticDefaultImports = true
      }
    }

    // ensure undefined are removed and other values are overridden
    for (const key of Object.keys(forcedOptions)) {
      const val = forcedOptions[key]
      if (val === undefined) {
        delete finalOptions[key]
      } else {
        finalOptions[key] = val
      }
    }

    return { input, resolved: result }
  }

  resolvePath(
    inputPath: string,
    { throwIfMissing = true, nodeResolve = false }: { throwIfMissing?: boolean; nodeResolve?: boolean } = {},
  ): string {
    let path: string = inputPath
    let nodeResolved = false
    if (path.startsWith('<rootDir>')) {
      path = resolve(join(this.rootDir, path.substr(9)))
    } else if (!isAbsolute(path)) {
      if (!path.startsWith('.') && nodeResolve) {
        try {
          path = require.resolve(path)
          nodeResolved = true
        } catch (_) {}
      }
      if (!nodeResolved) {
        path = resolve(this.cwd, path)
      }
    }
    if (!nodeResolved && nodeResolve) {
      try {
        path = require.resolve(path)
        nodeResolved = true
      } catch (_) {}
    }
    if (throwIfMissing && !existsSync(path)) {
      throw new Error(interpolate(Errors.FileNotFound, { inputPath, resolvedPath: path }))
    }
    this.logger.debug({ fromPath: inputPath, toPath: path }, 'resolved path from', inputPath, 'to', path)
    return path
  }

  /**
   * @internal
   */
  toJSON() {
    return this.jsonValue.value
  }
}
