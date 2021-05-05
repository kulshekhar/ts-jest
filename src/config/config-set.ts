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
import type { TransformedSource } from '@jest/transform'
import type { Config } from '@jest/types'
import { LogContexts, Logger } from 'bs-logger'
import { existsSync, readFileSync } from 'fs'
import { globsToMatcher } from 'jest-util'
import json5 = require('json5')
import { dirname, extname, isAbsolute, join, normalize, resolve } from 'path'
import {
  CompilerOptions,
  CustomTransformers,
  Diagnostic,
  FormatDiagnosticsHost,
  ParsedCommandLine,
  ScriptTarget,
} from 'typescript'

import { createCompilerInstance } from '../compiler/instance'
import { DEFAULT_JEST_TEST_MATCH } from '../constants'
import { factory as hoisting } from '../transformers/hoist-jest'
import type {
  AstTransformer,
  BabelConfig,
  BabelJestTransformer,
  TsCompiler,
  TsJestDiagnosticsCfg,
  TsJestGlobalOptions,
  TTypeScript,
} from '../types'
import { backportJestConfig } from '../utils/backports'
import { importer } from '../utils/importer'
import { stringify } from '../utils/json'
import { rootLogger } from '../utils/logger'
import { Memoize } from '../utils/memoize'
import { Deprecations, Errors, ImportReasons, interpolate } from '../utils/messages'
import { normalizeSlashes } from '../utils/normalize-slashes'
import { sha1 } from '../utils/sha1'
import { TSError } from '../utils/ts-error'
import type { RawCompilerOptions } from '../tsconfig-raw'

/**
 * @internal
 */
export const MY_DIGEST: string = readFileSync(resolve(__dirname, '..', '..', '.ts-jest-digest'), 'utf8')

interface TsJestHooksMap {
  afterProcess?(args: any[], result: string | TransformedSource): string | TransformedSource | void
}

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
export const TS_JEST_OUT_DIR = '$$ts-jest$$'

const TARGET_TO_VERSION_MAPPING: Record<number, string> = {
  [ScriptTarget.ES2018]: 'es2018',
  [ScriptTarget.ES2019]: 'es2019',
  [ScriptTarget.ES2020]: 'es2020',
  [ScriptTarget.ESNext]: 'ESNext',
}

/**
 * @internal
 */
// WARNING: DO NOT CHANGE THE ORDER OF CODE NAMES!
// ONLY APPEND IF YOU NEED TO ADD SOME
const enum DiagnosticCodes {
  TsJest = 151000,
  ConfigModuleOption,
}

const normalizeRegex = (pattern: string | RegExp | undefined): string | undefined =>
  pattern ? (typeof pattern === 'string' ? pattern : pattern.source) : undefined

const toDiagnosticCode = (code: any): number | undefined =>
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  code ? parseInt(`${code}`.trim().replace(/^TS/, ''), 10) ?? undefined : undefined

const toDiagnosticCodeList = (items: (string | number)[], into: number[] = []): number[] => {
  for (let item of items) {
    if (typeof item === 'string') {
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
  readonly logger: Logger
  readonly compilerModule: TTypeScript
  readonly isolatedModules: boolean
  readonly cwd: string
  tsCacheDir: string | undefined
  parsedTsConfig!: ParsedCommandLine | Record<string, any>
  customTransformers: CustomTransformers = Object.create(null)
  readonly rootDir: string
  /**
   * @internal
   */
  private _jestCfg!: Config.ProjectConfig
  /**
   * @internal
   */
  private _babelConfig: BabelConfig | undefined
  /**
   * @internal
   */
  private _babelJestTransformers: BabelJestTransformer | undefined
  /**
   * @internal
   */
  private _diagnostics!: TsJestDiagnosticsCfg
  /**
   * @internal
   */
  private _stringifyContentRegExp: RegExp | undefined
  /**
   * @internal
   */
  private readonly _matchablePatterns: (string | RegExp)[]
  /**
   * @internal
   */
  private readonly _matchTestFilePath: (filePath: string) => boolean
  /**
   * @internal
   */
  private _shouldGetDiagnosticsForFile!: ((filePath: string) => boolean) | RegExp
  protected _overriddenCompilerOptions: Partial<CompilerOptions> = {
    // we handle sourcemaps this way and not another
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    // we don't want to create declaration files
    declaration: false,
    noEmit: false, // set to true will make compiler API not emit any compiled results.
    // else istanbul related will be dropped
    removeComments: false,
    // to clear out else it's buggy
    out: undefined,
    outFile: undefined,
    composite: undefined, // see https://github.com/TypeStrong/ts-node/pull/657/files
    declarationDir: undefined,
    declarationMap: undefined,
    emitDeclarationOnly: undefined,
    sourceRoot: undefined,
    tsBuildInfoFile: undefined,
  }

  constructor(jestConfig: Config.ProjectConfig | undefined, private readonly parentLogger?: Logger) {
    this.logger = this.parentLogger
      ? this.parentLogger.child({ [LogContexts.namespace]: 'config' })
      : rootLogger.child({ namespace: 'config' })
    this._backportJestCfg(jestConfig ?? Object.create(null))
    this.cwd = normalize(this._jestCfg.cwd ?? process.cwd())
    this.rootDir = normalize(this._jestCfg.rootDir ?? this.cwd)
    const tsJestCfg = this._jestCfg.globals && this._jestCfg.globals['ts-jest']
    const options: TsJestGlobalOptions = tsJestCfg ?? Object.create(null)
    // compiler module
    this.compilerModule = importer.typescript(ImportReasons.TsJest, options.compiler ?? 'typescript')
    // isolatedModules
    this.isolatedModules = options.isolatedModules ?? false

    this.logger.debug({ compilerModule: this.compilerModule }, 'normalized compiler module config via ts-jest option')

    this._matchablePatterns = [...this._jestCfg.testMatch, ...this._jestCfg.testRegex].filter(
      (pattern) =>
        /**
         * jest config testRegex doesn't always deliver the correct RegExp object
         * See https://github.com/facebook/jest/issues/9778
         */
        pattern instanceof RegExp || typeof pattern === 'string',
    )
    if (!this._matchablePatterns.length) {
      this._matchablePatterns.push(...DEFAULT_JEST_TEST_MATCH)
    }
    this._matchTestFilePath = globsToMatcher(
      this._matchablePatterns.filter((pattern: any) => typeof pattern === 'string') as string[],
    )
    this._setupTsJestCfg(options)
    this._resolveTsCacheDir()
  }

  /**
   * @internal
   */
  private _backportJestCfg(jestCfg: Config.ProjectConfig): void {
    const config = backportJestConfig(this.logger, jestCfg)

    this.logger.debug({ jestConfig: config }, 'normalized jest config')

    this._jestCfg = config
  }

  /**
   * @internal
   */
  private _setupTsJestCfg(options: TsJestGlobalOptions): void {
    if (options.packageJson) {
      this.logger.warn(Deprecations.PackageJson)
    }

    // babel config (for babel-jest) default is undefined so we don't need to have fallback like tsConfig
    if (!options.babelConfig) {
      this.logger.debug('babel is disabled')
    } else {
      const baseBabelCfg = { cwd: this.cwd }
      if (typeof options.babelConfig === 'string') {
        const babelCfgPath = this.resolvePath(options.babelConfig)
        if (extname(options.babelConfig) === '.js') {
          this._babelConfig = {
            ...baseBabelCfg,
            ...require(babelCfgPath),
          }
        } else {
          this._babelConfig = {
            ...baseBabelCfg,
            ...json5.parse(readFileSync(babelCfgPath, 'utf-8')),
          }
        }
      } else if (typeof options.babelConfig === 'object') {
        this._babelConfig = {
          ...baseBabelCfg,
          ...options.babelConfig,
        }
      } else {
        this._babelConfig = baseBabelCfg
      }

      this.logger.debug({ babelConfig: this._babelConfig }, 'normalized babel config via ts-jest option')
    }
    if (!this._babelConfig) {
      this._overriddenCompilerOptions.module = this.compilerModule.ModuleKind.CommonJS
    } else {
      this._babelJestTransformers = importer
        .babelJest(ImportReasons.BabelJest)
        .createTransformer(this._babelConfig) as BabelJestTransformer

      this.logger.debug('created babel-jest transformer')
    }

    // diagnostics
    const diagnosticsOpt = options.diagnostics ?? true
    const ignoreList: (string | number)[] = [...IGNORE_DIAGNOSTIC_CODES]
    if (typeof diagnosticsOpt === 'object') {
      const { ignoreCodes } = diagnosticsOpt
      if (ignoreCodes) {
        Array.isArray(ignoreCodes) ? ignoreList.push(...ignoreCodes) : ignoreList.push(ignoreCodes)
      }
      this._diagnostics = {
        pretty: diagnosticsOpt.pretty ?? true,
        exclude: diagnosticsOpt.exclude ?? [],
        ignoreCodes: toDiagnosticCodeList(ignoreList),
        throws: !diagnosticsOpt.warnOnly,
      }
      if (diagnosticsOpt.pathRegex) {
        this.logger.warn(Deprecations.PathRegex)

        this._diagnostics = {
          ...this._diagnostics,
          pathRegex: normalizeRegex(diagnosticsOpt.pathRegex),
        }
      }
    } else {
      this._diagnostics = {
        ignoreCodes: diagnosticsOpt ? toDiagnosticCodeList(ignoreList) : [],
        exclude: [],
        pretty: true,
        throws: diagnosticsOpt,
      }
    }
    if (this._diagnostics.pathRegex && !this._diagnostics.exclude.length) {
      this._shouldGetDiagnosticsForFile = new RegExp(this._diagnostics.pathRegex)
    } else {
      this._shouldGetDiagnosticsForFile = this._diagnostics.exclude.length
        ? globsToMatcher(this._diagnostics.exclude)
        : () => true
    }

    this.logger.debug({ diagnostics: this._diagnostics }, 'normalized diagnostics config via ts-jest option')

    // tsconfig
    if (options.tsConfig) {
      this.logger.warn(Deprecations.TsConfig)
    }
    const tsconfigOpt = options.tsConfig ?? options.tsconfig
    const configFilePath = typeof tsconfigOpt === 'string' ? this.resolvePath(tsconfigOpt) : undefined
    this.parsedTsConfig = this._resolveTsConfig(
      typeof tsconfigOpt === 'object' ? tsconfigOpt : undefined,
      configFilePath,
    )
    // throw errors if any matching wanted diagnostics
    this.raiseDiagnostics(this.parsedTsConfig.errors, configFilePath)

    this.logger.debug({ tsconfig: this.parsedTsConfig }, 'normalized typescript config via ts-jest option')

    // transformers
    const { astTransformers } = options
    this.customTransformers = {
      before: [hoisting(this)],
    }
    if (astTransformers) {
      if (Array.isArray(astTransformers)) {
        this.logger.warn(Deprecations.AstTransformerArrayConfig)

        this.customTransformers = {
          before: [
            ...this.customTransformers.before,
            ...astTransformers.map((transformer) => {
              const transformerPath = this.resolvePath(transformer, { nodeResolve: true })

              return require(transformerPath).factory(this)
            }),
          ],
        }
      } else {
        const resolveTransformers = (transformers: (string | AstTransformer)[]) =>
          transformers.map((transformer) => {
            let transformerPath: string
            if (typeof transformer === 'string') {
              transformerPath = this.resolvePath(transformer, { nodeResolve: true })

              return require(transformerPath).factory(this)
            } else {
              transformerPath = this.resolvePath(transformer.path, { nodeResolve: true })

              return require(transformerPath).factory(this, transformer.options)
            }
          })
        if (astTransformers.before) {
          this.customTransformers = {
            before: [...this.customTransformers.before, ...resolveTransformers(astTransformers.before)],
          }
        }
        if (astTransformers.after) {
          this.customTransformers = {
            ...this.customTransformers,
            after: resolveTransformers(astTransformers.after),
          }
        }
        if (astTransformers.afterDeclarations) {
          this.customTransformers = {
            ...this.customTransformers,
            afterDeclarations: resolveTransformers(astTransformers.afterDeclarations),
          }
        }
      }
    }

    this.logger.debug(
      { customTransformers: this.customTransformers },
      'normalized custom AST transformers via ts-jest option',
    )

    // stringifyContentPathRegex
    if (options.stringifyContentPathRegex) {
      this._stringifyContentRegExp =
        typeof options.stringifyContentPathRegex === 'string'
          ? new RegExp(normalizeRegex(options.stringifyContentPathRegex)!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
          : options.stringifyContentPathRegex

      this.logger.debug(
        { stringifyContentPathRegex: this._stringifyContentRegExp },
        'normalized stringifyContentPathRegex config via ts-jest option',
      )
    }
  }

  /**
   * @internal
   */
  private _resolveTsCacheDir(): void {
    if (!this._jestCfg.cache) {
      this.logger.debug('file caching disabled')

      return undefined
    }
    const cacheSuffix = sha1(
      stringify({
        version: this.compilerModule.version,
        digest: this.tsJestDigest,
        compilerModule: this.compilerModule,
        compilerOptions: this.parsedTsConfig.options,
        isolatedModules: this.isolatedModules,
        diagnostics: this._diagnostics,
      }),
    )
    const res = join(this._jestCfg.cacheDirectory, 'ts-jest', cacheSuffix.substr(0, 2), cacheSuffix.substr(2))

    this.logger.debug({ cacheDirectory: res }, 'will use file caching')

    this.tsCacheDir = res
  }

  /**
   * Load TypeScript configuration. Returns the parsed TypeScript config and
   * any `tsConfig` options specified in ts-jest tsConfig
   */
  protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): Record<string, any>
  // eslint-disable-next-line no-dupe-class-members
  protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): ParsedCommandLine {
    let config = { compilerOptions: Object.create(null) }
    let basePath = normalizeSlashes(this.rootDir)
    const ts = this.compilerModule
    // Read project configuration when available.
    const configFileName: string | undefined = resolvedConfigFile
      ? normalizeSlashes(resolvedConfigFile)
      : ts.findConfigFile(normalizeSlashes(this.rootDir), ts.sys.fileExists)
    if (configFileName) {
      this.logger.debug({ tsConfigFileName: configFileName }, 'readTsConfig(): reading', configFileName)

      const result = ts.readConfigFile(configFileName, ts.sys.readFile)
      // Return diagnostics.
      if (result.error) {
        return { errors: [result.error], fileNames: [], options: {} }
      }

      config = result.config
      basePath = normalizeSlashes(dirname(configFileName))
    }
    // Override default configuration options `ts-jest` requires.
    config.compilerOptions = {
      ...config.compilerOptions,
      ...compilerOptions,
    }

    // parse json, merge config extending others, ...
    const result = ts.parseJsonConfigFileContent(config, ts.sys, basePath, undefined, configFileName)
    if (result.options.sourceMap === false) {
      this.logger.warn(
        interpolate(Deprecations.SourceMapFalseNote, {
          path: result.options.configFilePath,
        }),
      )
    }
    const { _overriddenCompilerOptions: forcedOptions } = this
    const finalOptions = result.options
    // Target ES5 output by default (instead of ES3).
    if (finalOptions.target === undefined) {
      finalOptions.target = ts.ScriptTarget.ES5
    }

    // check the module interoperability
    const target = finalOptions.target
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
      result.errors.push({
        code: DiagnosticCodes.ConfigModuleOption,
        messageText: Errors.ConfigNoModuleInterop,
        category: ts.DiagnosticCategory.Message,
        file: undefined,
        start: undefined,
        length: undefined,
      })
      // at least enable synthetic default imports (except if it's set in the input config)
      if (!('allowSyntheticDefaultImports' in config.compilerOptions)) {
        finalOptions.allowSyntheticDefaultImports = true
      }
    }
    // Make sure when allowJs is enabled, outDir is required to have when using allowJs: true
    if (finalOptions.allowJs && !finalOptions.outDir) {
      finalOptions.outDir = TS_JEST_OUT_DIR
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
    /**
     * See https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping
     * Every time this page is updated, we also need to update here. Here we only show warning message for Node LTS versions
     */
    const nodeJsVer = process.version
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const compilationTarget = result.options.target!
    /* istanbul ignore next (cover by e2e) */
    if (
      !this._babelConfig &&
      ((nodeJsVer.startsWith('v10') && compilationTarget > ScriptTarget.ES2018) ||
        (nodeJsVer.startsWith('v12') && compilationTarget > ScriptTarget.ES2019))
    ) {
      const message = interpolate(Errors.MismatchNodeTargetMapping, {
        nodeJsVer: process.version,
        compilationTarget: config.compilerOptions.target ?? TARGET_TO_VERSION_MAPPING[compilationTarget],
      })

      this.logger.warn(message)
    }

    return result
  }

  /**
   * @internal
   */
  @Memoize()
  get tsCompiler(): TsCompiler {
    return createCompilerInstance(this)
  }

  /**
   * @internal
   */
  get babelConfig(): BabelConfig | undefined {
    return this._babelConfig
  }

  /**
   * @internal
   */
  get babelJestTransformer(): BabelJestTransformer | undefined {
    return this._babelJestTransformers
  }

  /**
   * Use by e2e, don't mark as internal
   */
  @Memoize()
  // eslint-disable-next-line class-methods-use-this
  get tsJestDigest(): string {
    return MY_DIGEST
  }

  /**
   * @internal
   */
  @Memoize()
  get hooks(): TsJestHooksMap {
    let hooksFile = process.env.TS_JEST_HOOKS
    if (hooksFile) {
      hooksFile = resolve(this.cwd, hooksFile)

      return importer.tryTheseOr(hooksFile, {})
    }

    return {}
  }

  isTestFile(fileName: string): boolean {
    return this._matchablePatterns.some((pattern) =>
      typeof pattern === 'string' ? this._matchTestFilePath(fileName) : pattern.test(fileName),
    )
  }

  shouldStringifyContent(filePath: string): boolean {
    return this._stringifyContentRegExp ? this._stringifyContentRegExp.test(filePath) : false
  }

  raiseDiagnostics(diagnostics: Diagnostic[], filePath?: string, logger?: Logger): void {
    const { ignoreCodes } = this._diagnostics
    const { DiagnosticCategory } = this.compilerModule
    const filteredDiagnostics =
      filePath && !this.shouldReportDiagnostics(filePath)
        ? []
        : diagnostics.filter((diagnostic) => {
            if (diagnostic.file?.fileName && !this.shouldReportDiagnostics(diagnostic.file.fileName)) {
              return false
            }

            return !ignoreCodes.includes(diagnostic.code)
          })
    if (!filteredDiagnostics.length) return
    const error = this._createTsError(filteredDiagnostics)
    // only throw if `warnOnly` and it is a warning or error
    const importantCategories = [DiagnosticCategory.Warning, DiagnosticCategory.Error]
    if (this._diagnostics.throws && filteredDiagnostics.some((d) => importantCategories.includes(d.category))) {
      throw error
    }
    /* istanbul ignore next (already covered) */
    logger ? logger.warn({ error }, error.message) : this.logger.warn({ error }, error.message)
  }

  shouldReportDiagnostics(filePath: string): boolean {
    return this._shouldGetDiagnosticsForFile instanceof RegExp
      ? this._shouldGetDiagnosticsForFile.test(filePath)
      : this._shouldGetDiagnosticsForFile(filePath)
  }

  /**
   * @internal
   */
  private _createTsError(diagnostics: readonly Diagnostic[]): TSError {
    const formatDiagnostics = this._diagnostics.pretty
      ? this.compilerModule.formatDiagnosticsWithColorAndContext
      : this.compilerModule.formatDiagnostics
    /* istanbul ignore next (not possible to cover) */
    const diagnosticHost: FormatDiagnosticsHost = {
      getNewLine: () => '\n',
      getCurrentDirectory: () => this.cwd,
      getCanonicalFileName: (path: string) => path,
    }
    const diagnosticText = formatDiagnostics(diagnostics, diagnosticHost)
    const diagnosticCodes = diagnostics.map((x) => x.code)

    return new TSError(diagnosticText, diagnosticCodes)
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
}
