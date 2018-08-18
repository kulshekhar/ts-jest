import { JsonableValue } from './jsonable-value'
import {
  BabelConfig,
  TsJestConfig,
  TsJestGlobalOptions,
  TTypeScript,
  TsJestHooksMap,
  BabelJestTransformer,
  TsCompiler,
} from './types'
import { resolve, isAbsolute, join, dirname } from 'path'
import { Memoize } from './memoize'
import { backportJestConfig } from './backports'
import { Errors, ImportReasons, interpolate } from './messages'
import arrify from 'arrify'
import yn = require('yn')
import json5 from 'json5'
import { existsSync, readFileSync } from 'fs'
import { importer } from './importer'
import {
  Diagnostic,
  FormatDiagnosticsHost,
  ParsedCommandLine,
} from 'typescript'
import { EOL } from 'os'
import { TSError } from './ts-error'
import { sha1 } from './sha1'
import { stringify } from './json'
import { normalizeSlashes } from './normalize-slashes'
import { createCompiler } from './compiler'

const DEFAULT_COMPILER_OPTIONS = {
  inlineSourceMap: true,
  inlineSources: true,
}
const FORCE_COMPILER_OPTIONS = {
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
  declaration: false,
  noEmit: false,
  outDir: '$$ts-jest$$',
  out: undefined,
  outFile: undefined,
  composite: undefined,
  declarationDir: undefined,
  declarationMap: undefined,
  emitDeclarationOnly: undefined,
  module: 'commonjs',
  esModuleInterop: true,
  removeComments: false,
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
    if (diagnosticsOpt === true || diagnosticsOpt == null) {
      diagnostics = { ignoreCodes: [], pretty: true }
    } else if (diagnosticsOpt === false) {
      diagnostics = {
        pretty: true,
        ignoreCodes: [],
        pathRegex: 'a^', // matches nothing
      }
    } else {
      diagnostics = {
        pretty: yn(diagnosticsOpt, { default: true }),
        ignoreCodes: arrify(diagnosticsOpt.ignoreCodes).map(n =>
          parseInt(n as string, 10),
        ),
        pathRegex: diagnosticsOpt.pathRegex
          ? diagnosticsOpt.pathRegex.toString()
          : undefined,
      }
    }
    diagnostics.ignoreCodes = diagnostics.ignoreCodes
      .concat([
        6059, // "'rootDir' is expected to contain all source files."
        18002, // "The 'files' list in config file is empty."
        18003, // "No inputs were found in config file."
      ])
      .filter((code, index, list) => list.indexOf(code) === index)

    // stringifyContentPathRegex option
    const stringifyContentPathRegex = options.stringifyContentPathRegex
      ? options.stringifyContentPathRegex.toString()
      : undefined

    // parsed options
    return {
      version: require('../../package.json').version,
      tsConfig,
      babelConfig,
      diagnostics,
      typeCheck: yn(options),
      compiler: options.compiler || 'typescript',
      stringifyContentPathRegex,
    }
  }

  get typescript(): ParsedCommandLine {
    const {
      tsJest: { tsConfig },
    } = this
    const config = this.readTsConfig(
      tsConfig && tsConfig.kind === 'inline' ? tsConfig.value : undefined,
      tsConfig && tsConfig.kind === 'file' ? tsConfig.value : undefined,
      tsConfig == null,
    )
    const configDiagnosticList = this.filterDiagnostics(config.errors)
    if (configDiagnosticList.length) {
      throw this.createTsError(configDiagnosticList)
    }
    return config
  }

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
    const { OptionManager, loadOptions } = importer.babelCore(
      ImportReasons.babelJest,
    )
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
    return importer.typescript(ImportReasons.tsJest, this.tsJest.compiler)
  }

  @Memoize()
  get babelJestTransformer(): BabelJestTransformer | undefined {
    const { babel } = this
    if (!babel) return
    return importer
      .babelJest(ImportReasons.babelJest)
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
      getNewLine: () => EOL,
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

  readTsConfig(
    compilerOptions?: object,
    project?: string | null,
    noProject?: boolean | null,
  ): ParsedCommandLine {
    let config = { compilerOptions: {} }
    let basePath = normalizeSlashes(this.cwd)
    let configFileName: string | undefined
    const ts = this.compilerModule

    // Read project configuration when available.
    if (!noProject) {
      configFileName = project
        ? normalizeSlashes(resolve(this.cwd, project))
        : ts.findConfigFile(normalizeSlashes(this.cwd), ts.sys.fileExists)

      if (configFileName) {
        const result = ts.readConfigFile(configFileName, ts.sys.readFile)

        // Return diagnostics.
        if (result.error) {
          return { errors: [result.error], fileNames: [], options: {} }
        }

        config = result.config
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

    return result
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
    return new JsonableValue({
      jest: this.jest,
      tsJest: this.tsJest,
      babel: this.babel,
      typescript: this.typescript,
    })
  }

  @Memoize()
  get cacheKey(): string {
    return this.jsonValue.serialized
  }
}
