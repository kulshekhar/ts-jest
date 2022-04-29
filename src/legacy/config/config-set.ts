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
import { existsSync, readFileSync } from 'fs'
import Module from 'module'
import { dirname, extname, isAbsolute, join, normalize, resolve } from 'path'

import { LogContexts, Logger } from 'bs-logger'
import { globsToMatcher } from 'jest-util'
import json5 from 'json5'
import type * as ts from 'typescript'

import { DEFAULT_JEST_TEST_MATCH, JS_JSX_EXTENSIONS } from '../../constants'
import type { RawCompilerOptions } from '../../raw-compiler-options'
import * as hoistJestTransformer from '../../transformers/hoist-jest'
import type {
  AstTransformer,
  AstTransformerDesc,
  BabelConfig,
  BabelJestTransformer,
  ProjectConfigTsJest,
  TsJestAstTransformer,
  TsJestDiagnosticsCfg,
  TsJestGlobalOptions,
  TTypeScript,
} from '../../types'
import { TsCompilerInstance } from '../../types'
import { rootLogger, stringify } from '../../utils'
import { backportJestConfig } from '../../utils/backports'
import { importer } from '../../utils/importer'
import { Errors, ImportReasons, interpolate } from '../../utils/messages'
import { normalizeSlashes } from '../../utils/normalize-slashes'
import { sha1 } from '../../utils/sha1'
import { TSError } from '../../utils/ts-error'

/**
 * @internal
 */
export const MY_DIGEST: string = readFileSync(resolve(__dirname, '../../../.ts-jest-digest'), 'utf8')

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

const toDiagnosticCode = (code?: string | number): number | undefined =>
  code ? parseInt(`${code}`.trim().replace(/^TS/, ''), 10) ?? undefined : undefined

const toDiagnosticCodeList = (items: Array<string | number>, into: number[] = []): number[] => {
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

const requireFromString = (code: string, fileName: string) => {
  // @ts-expect-error `_nodeModulePaths` is not exposed in typing
  const paths = Module._nodeModulePaths(dirname(fileName))
  const parent = module.parent as Module | undefined
  const m = new Module(fileName, parent)
  m.filename = fileName
  m.paths = [].concat(paths)
  // @ts-expect-error `_compile` is not exposed in typing
  m._compile(code, fileName)
  const exports = m.exports
  parent && parent.children && parent.children.splice(parent.children.indexOf(m), 1)

  return exports
}

export class ConfigSet {
  /**
   * Use by e2e, don't mark as internal
   */
  readonly tsJestDigest = MY_DIGEST
  readonly logger: Logger
  readonly compilerModule: TTypeScript
  readonly isolatedModules: boolean
  readonly cwd: string
  readonly rootDir: string
  cacheSuffix!: string
  tsCacheDir: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedTsConfig!: ts.ParsedCommandLine | Record<string, any>
  resolvedTransformers: TsJestAstTransformer = {
    before: [],
    after: [],
    afterDeclarations: [],
  }
  useESM = false
  /**
   * @internal
   */
  babelConfig: BabelConfig | undefined
  /**
   * @internal
   */
  babelJestTransformer: BabelJestTransformer | undefined
  /**
   * @internal
   */
  private _jestCfg!: ProjectConfigTsJest
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
  private readonly _matchablePatterns: Array<string | RegExp>
  /**
   * @internal
   */
  private readonly _matchTestFilePath: (filePath: string) => boolean
  /**
   * @internal
   */
  private _shouldIgnoreDiagnosticsForFile!: (filePath: string) => boolean
  /**
   * @internal
   */
  private readonly _overriddenCompilerOptions: Partial<ts.CompilerOptions> = {
    inlineSourceMap: false,
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

  constructor(jestConfig: ProjectConfigTsJest | undefined, readonly parentLogger?: Logger) {
    this.logger = this.parentLogger
      ? this.parentLogger.child({ [LogContexts.namespace]: 'config' })
      : rootLogger.child({ namespace: 'config' })
    this._backportJestCfg(jestConfig ?? Object.create(null))
    this.cwd = normalize(this._jestCfg.cwd ?? process.cwd())
    this.rootDir = normalize(this._jestCfg.rootDir ?? this.cwd)
    const tsJestCfg = this._jestCfg.globals && this._jestCfg.globals['ts-jest']
    const options = tsJestCfg ?? Object.create(null)
    // compiler module
    this.compilerModule = importer.typescript(ImportReasons.TsJest, options.compiler ?? 'typescript')
    // isolatedModules
    this.isolatedModules = options.isolatedModules ?? false

    this.logger.debug({ compilerModule: this.compilerModule }, 'normalized compiler module config via ts-jest option')

    this._setupConfigSet(options)
    this._resolveTsCacheDir()
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
      this._matchablePatterns.filter((pattern: string | RegExp) => typeof pattern === 'string') as string[],
    )
  }

  /**
   * @internal
   */
  private _backportJestCfg(jestCfg: ProjectConfigTsJest): void {
    const config = backportJestConfig(this.logger, jestCfg)

    this.logger.debug({ jestConfig: config }, 'normalized jest config')

    this._jestCfg = {
      ...config,
      testMatch: config.testMatch ?? DEFAULT_JEST_TEST_MATCH,
      testRegex: config.testRegex ?? [],
    }
  }

  /**
   * @internal
   */
  private _setupConfigSet(options: TsJestGlobalOptions): void {
    // useESM
    this.useESM = options.useESM ?? false

    // babel config (for babel-jest) default is undefined so we don't need to have fallback like tsConfig
    if (!options.babelConfig) {
      this.logger.debug('babel is disabled')
    } else {
      const baseBabelCfg = { cwd: this.cwd }
      if (typeof options.babelConfig === 'string') {
        const babelCfgPath = this.resolvePath(options.babelConfig)
        const babelFileExtName = extname(options.babelConfig)
        if (babelFileExtName === '.js' || babelFileExtName === '.cjs') {
          this.babelConfig = {
            ...baseBabelCfg,
            ...require(babelCfgPath),
          }
        } else {
          this.babelConfig = {
            ...baseBabelCfg,
            ...json5.parse(readFileSync(babelCfgPath, 'utf-8')),
          }
        }
      } else if (typeof options.babelConfig === 'object') {
        this.babelConfig = {
          ...baseBabelCfg,
          ...options.babelConfig,
        }
      } else {
        this.babelConfig = baseBabelCfg
      }

      this.logger.debug({ babelConfig: this.babelConfig }, 'normalized babel config via ts-jest option')

      this.babelJestTransformer = importer
        .babelJest(ImportReasons.BabelJest)
        .createTransformer(this.babelConfig) as BabelJestTransformer

      this.logger.debug('created babel-jest transformer')
    }

    // diagnostics
    const diagnosticsOpt = options.diagnostics ?? true
    const ignoreList: Array<string | number> = [...IGNORE_DIAGNOSTIC_CODES]
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
    } else {
      this._diagnostics = {
        ignoreCodes: diagnosticsOpt ? toDiagnosticCodeList(ignoreList) : [],
        exclude: [],
        pretty: true,
        throws: diagnosticsOpt,
      }
    }
    this._shouldIgnoreDiagnosticsForFile = this._diagnostics.exclude.length
      ? globsToMatcher(this._diagnostics.exclude)
      : () => false

    this.logger.debug({ diagnostics: this._diagnostics }, 'normalized diagnostics config via ts-jest option')

    // tsconfig
    const tsconfigOpt = options.tsconfig
    const configFilePath = typeof tsconfigOpt === 'string' ? this.resolvePath(tsconfigOpt) : undefined
    this.parsedTsConfig = this._getAndResolveTsConfig(
      typeof tsconfigOpt === 'object' ? tsconfigOpt : undefined,
      configFilePath,
    )
    // throw errors if any matching wanted diagnostics
    this.raiseDiagnostics(this.parsedTsConfig.errors, configFilePath)

    this.logger.debug({ tsconfig: this.parsedTsConfig }, 'normalized typescript config via ts-jest option')

    // transformers
    this.resolvedTransformers.before = [
      {
        factory: hoistJestTransformer.factory,
        name: hoistJestTransformer.name,
        version: hoistJestTransformer.version,
      },
    ]
    const { astTransformers } = options
    if (astTransformers) {
      const resolveTransformerFunc = (transformerPath: string) => {
        let transformerFunc: {
          version: number
          name: string
          factory: (
            compilerInstance: TsCompilerInstance,
            options?: Record<string, unknown>,
          ) => (ctx: ts.TransformationContext) => ts.Transformer<ts.SourceFile>
        }
        if (extname(transformerPath) === '.ts') {
          const compiledTransformer = importer
            .esBuild(ImportReasons.EsBuild)
            .transformSync(readFileSync(transformerPath, 'utf-8'), {
              loader: 'ts',
              format: 'cjs',
              target: 'es2015',
            }).code
          transformerFunc = requireFromString(compiledTransformer, transformerPath.replace('.ts', '.js'))
        } else {
          transformerFunc = require(transformerPath)
        }
        if (!transformerFunc.version) {
          this.logger.warn(Errors.MissingTransformerVersion, { file: transformerPath })
        }
        if (!transformerFunc.name) {
          this.logger.warn(Errors.MissingTransformerName, { file: transformerPath })
        }

        return transformerFunc
      }
      const resolveTransformers = (transformers: Array<string | AstTransformer>): AstTransformerDesc[] =>
        transformers.map((transformer) => {
          if (typeof transformer === 'string') {
            return resolveTransformerFunc(this.resolvePath(transformer, { nodeResolve: true }))
          } else {
            return {
              ...resolveTransformerFunc(this.resolvePath(transformer.path, { nodeResolve: true })),
              options: transformer.options,
            }
          }
        })
      if (astTransformers.before) {
        /* istanbul ignore next (already covered in unit test) */
        this.resolvedTransformers.before?.push(...resolveTransformers(astTransformers.before))
      }
      if (astTransformers.after) {
        this.resolvedTransformers = {
          ...this.resolvedTransformers,
          after: resolveTransformers(astTransformers.after),
        }
      }
      if (astTransformers.afterDeclarations) {
        this.resolvedTransformers = {
          ...this.resolvedTransformers,
          afterDeclarations: resolveTransformers(astTransformers.afterDeclarations),
        }
      }
    }

    this.logger.debug(
      { customTransformers: this.resolvedTransformers },
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
    this.cacheSuffix = sha1(
      stringify({
        version: this.compilerModule.version,
        digest: this.tsJestDigest,
        babelConfig: this.babelConfig,
        tsconfig: {
          options: this.parsedTsConfig.options,
          raw: this.parsedTsConfig.raw,
        },
        isolatedModules: this.isolatedModules,
        diagnostics: this._diagnostics,
        transformers: Object.values(this.resolvedTransformers)
          .reduce((prevVal, currentVal) => [...prevVal, currentVal])
          .map((transformer: AstTransformerDesc) => `${transformer.name}-${transformer.version}`),
      }),
    )
    if (!this._jestCfg.cache) {
      this.logger.debug('file caching disabled')
    } else {
      const res = join(
        this._jestCfg.cacheDirectory,
        'ts-jest',
        this.cacheSuffix.substr(0, 2),
        this.cacheSuffix.substr(2),
      )

      this.logger.debug({ cacheDirectory: res }, 'will use file caching')

      this.tsCacheDir = res
    }
  }

  /**
   * @internal
   */
  private _getAndResolveTsConfig(
    compilerOptions?: RawCompilerOptions,
    resolvedConfigFile?: string,
  ): ts.ParsedCommandLine {
    const result = this._resolveTsConfig(compilerOptions, resolvedConfigFile) as ts.ParsedCommandLine
    const { _overriddenCompilerOptions: forcedOptions } = this
    const finalOptions = result.options
    // Target ES2015 output by default (instead of ES3).
    if (finalOptions.target === undefined) {
      finalOptions.target = this.compilerModule.ScriptTarget.ES2015
    }

    // check the module interoperability
    const target = finalOptions.target
    // compute the default if not set
    const defaultModule = [this.compilerModule.ScriptTarget.ES3, this.compilerModule.ScriptTarget.ES5].includes(target)
      ? this.compilerModule.ModuleKind.CommonJS
      : this.compilerModule.ModuleKind.ESNext
    const moduleValue = finalOptions.module ?? defaultModule
    if (
      !this.babelConfig &&
      moduleValue !== this.compilerModule.ModuleKind.CommonJS &&
      !(finalOptions.esModuleInterop || finalOptions.allowSyntheticDefaultImports)
    ) {
      result.errors.push({
        code: DiagnosticCodes.ConfigModuleOption,
        messageText: Errors.ConfigNoModuleInterop,
        category: this.compilerModule.DiagnosticCategory.Message,
        file: undefined,
        start: undefined,
        length: undefined,
      })
      // at least enable synthetic default imports (except if it's set in the input config)
      /* istanbul ignore next (already covered in unit test) */
      if (!('allowSyntheticDefaultImports' in finalOptions)) {
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
    const compilationTarget = result.options.target
    const TARGET_TO_VERSION_MAPPING: Record<number, string> = {
      [this.compilerModule.ScriptTarget.ES2018]: 'es2018',
      [this.compilerModule.ScriptTarget.ES2019]: 'es2019',
      [this.compilerModule.ScriptTarget.ES2020]: 'es2020',
      [this.compilerModule.ScriptTarget.ESNext]: 'ESNext',
    }
    /* istanbul ignore next (cover by e2e) */
    if (
      compilationTarget &&
      !this.babelConfig &&
      nodeJsVer.startsWith('v12') &&
      compilationTarget > this.compilerModule.ScriptTarget.ES2019
    ) {
      const message = interpolate(Errors.MismatchNodeTargetMapping, {
        nodeJsVer: process.version,
        compilationTarget: TARGET_TO_VERSION_MAPPING[compilationTarget],
      })

      this.logger.warn(message)
    }
    const resultOptions = result.options
    const sourceMap = resultOptions.sourceMap ?? true

    return {
      ...result,
      options: {
        ...resultOptions,
        sourceMap,
        inlineSources: sourceMap,
        module: resultOptions.module ?? this.compilerModule.ModuleKind.CommonJS,
      },
    }
  }

  /**
   * Load TypeScript configuration. Returns the parsed TypeScript config and any `tsconfig` options specified in ts-jest
   * Subclasses which extend `ConfigSet` can override the default behavior
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): Record<string, any>
  // eslint-disable-next-line no-dupe-class-members
  protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): ts.ParsedCommandLine {
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
    return ts.parseJsonConfigFileContent(config, ts.sys, basePath, undefined, configFileName)
  }

  isTestFile(fileName: string): boolean {
    return this._matchablePatterns.some((pattern) =>
      typeof pattern === 'string' ? this._matchTestFilePath(fileName) : pattern.test(fileName),
    )
  }

  shouldStringifyContent(filePath: string): boolean {
    return this._stringifyContentRegExp ? this._stringifyContentRegExp.test(filePath) : false
  }

  raiseDiagnostics(diagnostics: ts.Diagnostic[], filePath?: string, logger?: Logger): void {
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
    const fileExtension = extname(filePath)

    return JS_JSX_EXTENSIONS.includes(fileExtension)
      ? this.parsedTsConfig.options.checkJs && !this._shouldIgnoreDiagnosticsForFile(filePath)
      : !this._shouldIgnoreDiagnosticsForFile(filePath)
  }

  /**
   * @internal
   */
  private _createTsError(diagnostics: readonly ts.Diagnostic[]): TSError {
    const formatDiagnostics = this._diagnostics.pretty
      ? this.compilerModule.formatDiagnosticsWithColorAndContext
      : this.compilerModule.formatDiagnostics
    /* istanbul ignore next (not possible to cover) */
    const diagnosticHost: ts.FormatDiagnosticsHost = {
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
