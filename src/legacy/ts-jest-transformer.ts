import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

import type { SyncTransformer, TransformedSource } from '@jest/transform'
import type { Logger } from 'bs-logger'

import { DECLARATION_TYPE_EXT, JS_JSX_REGEX, TS_TSX_REGEX } from '../constants'
import type { CompilerInstance, DepGraphInfo, ProjectConfigTsJest, TransformOptionsTsJest } from '../types'
import { parse, stringify, JsonableValue, rootLogger } from '../utils'
import { importer } from '../utils/importer'
import { Errors, interpolate } from '../utils/messages'
import { sha1 } from '../utils/sha1'
import { VersionCheckers } from '../utils/version-checkers'

import { TsJestCompiler } from './compiler'
import { ConfigSet } from './config/config-set'

interface CachedConfigSet {
  configSet: ConfigSet
  jestConfig: JsonableValue<ProjectConfigTsJest>
  transformerCfgStr: string
  compiler: CompilerInstance
  depGraphs: Map<string, DepGraphInfo>
  tsResolvedModulesCachePath: string | undefined
  watchMode: boolean
}

interface TsJestHooksMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  afterProcess?(args: any[], result: TransformedSource): TransformedSource | void
}

/**
 * @internal
 */
export const CACHE_KEY_EL_SEPARATOR = '\x00'

export class TsJestTransformer implements SyncTransformer {
  /**
   * cache ConfigSet between test runs
   *
   * @internal
   */
  private static readonly _cachedConfigSets: CachedConfigSet[] = []
  private readonly _logger: Logger
  protected _compiler!: CompilerInstance
  private _tsResolvedModulesCachePath: string | undefined
  private _transformCfgStr!: string
  private _depGraphs: Map<string, DepGraphInfo> = new Map<string, DepGraphInfo>()
  private _watchMode = false

  constructor() {
    this._logger = rootLogger.child({ namespace: 'ts-jest-transformer' })
    VersionCheckers.jest.warn()
    /**
     * For some unknown reasons, `this` is undefined in `getCacheKey` and `process`
     * when running Jest in ESM mode
     */
    this.getCacheKey = this.getCacheKey.bind(this)
    this.getCacheKeyAsync = this.getCacheKeyAsync.bind(this)
    this.process = this.process.bind(this)
    this.processAsync = this.processAsync.bind(this)

    this._logger.debug('created new transformer')
    process.env.TS_JEST = '1'
  }

  private _configsFor(transformOptions: TransformOptionsTsJest): ConfigSet {
    const { config, cacheFS } = transformOptions
    const ccs: CachedConfigSet | undefined = TsJestTransformer._cachedConfigSets.find(
      (cs) => cs.jestConfig.value === config,
    )
    let configSet: ConfigSet
    if (ccs) {
      this._transformCfgStr = ccs.transformerCfgStr
      this._compiler = ccs.compiler
      this._depGraphs = ccs.depGraphs
      this._tsResolvedModulesCachePath = ccs.tsResolvedModulesCachePath
      this._watchMode = ccs.watchMode
      configSet = ccs.configSet
    } else {
      // try to look-it up by stringified version
      const serializedJestCfg = stringify(config)
      const serializedCcs = TsJestTransformer._cachedConfigSets.find(
        (cs) => cs.jestConfig.serialized === serializedJestCfg,
      )
      if (serializedCcs) {
        // update the object so that we can find it later
        // this happens because jest first calls getCacheKey with stringified version of
        // the config, and then it calls the transformer with the proper object
        serializedCcs.jestConfig.value = config
        this._transformCfgStr = serializedCcs.transformerCfgStr
        this._compiler = serializedCcs.compiler
        this._depGraphs = serializedCcs.depGraphs
        this._tsResolvedModulesCachePath = serializedCcs.tsResolvedModulesCachePath
        this._watchMode = serializedCcs.watchMode
        configSet = serializedCcs.configSet
      } else {
        // create the new record in the index
        this._logger.info('no matching config-set found, creating a new one')

        configSet = this._createConfigSet(config)
        const jest = { ...config }
        // we need to remove some stuff from jest config
        // this which does not depend on config
        jest.cacheDirectory = undefined as any // eslint-disable-line @typescript-eslint/no-explicit-any
        this._transformCfgStr = `${new JsonableValue(jest).serialized}${configSet.cacheSuffix}`
        this._createCompiler(configSet, cacheFS)
        this._getFsCachedResolvedModules(configSet)
        this._watchMode = process.argv.includes('--watch')
        TsJestTransformer._cachedConfigSets.push({
          jestConfig: new JsonableValue(config),
          configSet,
          transformerCfgStr: this._transformCfgStr,
          compiler: this._compiler,
          depGraphs: this._depGraphs,
          tsResolvedModulesCachePath: this._tsResolvedModulesCachePath,
          watchMode: this._watchMode,
        })
      }
    }

    return configSet
  }

  // eslint-disable-next-line class-methods-use-this
  protected _createConfigSet(config: ProjectConfigTsJest | undefined): ConfigSet {
    return new ConfigSet(config)
  }

  protected _createCompiler(configSet: ConfigSet, cacheFS: Map<string, string>): void {
    this._compiler = new TsJestCompiler(configSet, cacheFS)
  }

  /**
   * @public
   */
  process(sourceText: string, sourcePath: string, transformOptions: TransformOptionsTsJest): TransformedSource {
    this._logger.debug({ fileName: sourcePath, transformOptions }, 'processing', sourcePath)

    const configs = this._configsFor(transformOptions)
    const shouldStringifyContent = configs.shouldStringifyContent(sourcePath)
    const babelJest = shouldStringifyContent ? undefined : configs.babelJestTransformer
    let result = this.processWithTs(sourceText, sourcePath, transformOptions)
    if (babelJest) {
      this._logger.debug({ fileName: sourcePath }, 'calling babel-jest processor')

      // do not instrument here, jest will do it anyway afterwards
      result = babelJest.process(result.code, sourcePath, {
        ...transformOptions,
        instrument: false,
      })
    }
    result = this.runTsJestHook(sourcePath, sourceText, transformOptions, result)

    return result
  }

  async processAsync(
    sourceText: string,
    sourcePath: string,
    transformOptions: TransformOptionsTsJest,
  ): Promise<TransformedSource> {
    this._logger.debug({ fileName: sourcePath, transformOptions }, 'processing', sourcePath)

    return new Promise(async (resolve) => {
      const configs = this._configsFor(transformOptions)
      const shouldStringifyContent = configs.shouldStringifyContent(sourcePath)
      const babelJest = shouldStringifyContent ? undefined : configs.babelJestTransformer
      let result = this.processWithTs(sourceText, sourcePath, transformOptions)
      if (babelJest) {
        this._logger.debug({ fileName: sourcePath }, 'calling babel-jest processor')

        // do not instrument here, jest will do it anyway afterwards
        result = await babelJest.processAsync(result.code, sourcePath, {
          ...transformOptions,
          instrument: false,
        })
      }
      result = this.runTsJestHook(sourcePath, sourceText, transformOptions, result)

      resolve(result)
    })
  }

  private processWithTs(sourceText: string, sourcePath: string, transformOptions: TransformOptionsTsJest) {
    let result: TransformedSource
    const configs = this._configsFor(transformOptions)
    const shouldStringifyContent = configs.shouldStringifyContent(sourcePath)
    const babelJest = shouldStringifyContent ? undefined : configs.babelJestTransformer
    const isDefinitionFile = sourcePath.endsWith(DECLARATION_TYPE_EXT)
    const isJsFile = JS_JSX_REGEX.test(sourcePath)
    const isTsFile = !isDefinitionFile && TS_TSX_REGEX.test(sourcePath)
    if (shouldStringifyContent) {
      // handles here what we should simply stringify
      result = {
        code: `module.exports=${stringify(sourceText)}`,
      }
    } else if (isDefinitionFile) {
      // do not try to compile declaration files
      result = {
        code: '',
      }
    } else if (!configs.parsedTsConfig.options.allowJs && isJsFile) {
      // we've got a '.js' but the compiler option `allowJs` is not set or set to false
      this._logger.warn({ fileName: sourcePath }, interpolate(Errors.GotJsFileButAllowJsFalse, { path: sourcePath }))

      result = {
        code: sourceText,
      }
    } else if (isJsFile || isTsFile) {
      // transpile TS code (source maps are included)
      result = this._compiler.getCompiledOutput(sourceText, sourcePath, {
        depGraphs: this._depGraphs,
        supportsStaticESM: transformOptions.supportsStaticESM,
        watchMode: this._watchMode,
      })
    } else {
      // we should not get called for files with other extension than js[x], ts[x] and d.ts,
      // TypeScript will bail if we try to compile, and if it was to call babel, users can
      // define the transform value with `babel-jest` for this extension instead
      const message = babelJest ? Errors.GotUnknownFileTypeWithBabel : Errors.GotUnknownFileTypeWithoutBabel

      this._logger.warn({ fileName: sourcePath }, interpolate(message, { path: sourcePath }))

      result = {
        code: sourceText,
      }
    }

    return result
  }

  private runTsJestHook(
    sourcePath: string,
    sourceText: string,
    transformOptions: TransformOptionsTsJest,
    compiledOutput: TransformedSource,
  ) {
    let hooksFile = process.env.TS_JEST_HOOKS
    let hooks: TsJestHooksMap | undefined
    /* istanbul ignore next (cover by e2e) */
    if (hooksFile) {
      hooksFile = path.resolve(this._configsFor(transformOptions).cwd, hooksFile)
      hooks = importer.tryTheseOr(hooksFile, {})
    }
    // This is not supposed to be a public API but we keep it as some people use it
    if (hooks?.afterProcess) {
      this._logger.debug({ fileName: sourcePath, hookName: 'afterProcess' }, 'calling afterProcess hook')

      const newResult = hooks.afterProcess(
        [sourceText, sourcePath, transformOptions.config, transformOptions],
        compiledOutput,
      )
      if (newResult) {
        return newResult
      }
    }

    return compiledOutput
  }

  /**
   * Jest uses this to cache the compiled version of a file
   *
   * @see https://github.com/facebook/jest/blob/v23.5.0/packages/jest-runtime/src/script_transformer.js#L61-L90
   *
   * @public
   */
  getCacheKey(fileContent: string, filePath: string, transformOptions: TransformOptionsTsJest): string {
    const configs = this._configsFor(transformOptions)

    this._logger.debug({ fileName: filePath, transformOptions }, 'computing cache key for', filePath)

    // we do not instrument, ensure it is false all the time
    const { instrument = false } = transformOptions
    const constructingCacheKeyElements = [
      this._transformCfgStr,
      CACHE_KEY_EL_SEPARATOR,
      configs.rootDir,
      CACHE_KEY_EL_SEPARATOR,
      `instrument:${instrument ? 'on' : 'off'}`,
      CACHE_KEY_EL_SEPARATOR,
      fileContent,
      CACHE_KEY_EL_SEPARATOR,
      filePath,
    ]
    if (!configs.isolatedModules && this._tsResolvedModulesCachePath) {
      let resolvedModuleNames: string[]
      if (this._depGraphs.get(filePath)?.fileContent === fileContent) {
        this._logger.debug(
          { fileName: filePath, transformOptions },
          'getting resolved modules from disk caching or memory caching for',
          filePath,
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolvedModuleNames = this._depGraphs
          .get(filePath)!
          .resolvedModuleNames.filter((moduleName) => existsSync(moduleName))
      } else {
        this._logger.debug(
          { fileName: filePath, transformOptions },
          'getting resolved modules from TypeScript API for',
          filePath,
        )

        resolvedModuleNames = this._compiler.getResolvedModules(fileContent, filePath, transformOptions.cacheFS)
        this._depGraphs.set(filePath, {
          fileContent,
          resolvedModuleNames,
        })
        writeFileSync(this._tsResolvedModulesCachePath, stringify([...this._depGraphs]))
      }
      resolvedModuleNames.forEach((moduleName) => {
        constructingCacheKeyElements.push(
          CACHE_KEY_EL_SEPARATOR,
          moduleName,
          CACHE_KEY_EL_SEPARATOR,
          statSync(moduleName).mtimeMs.toString(),
        )
      })
    }

    return sha1(...constructingCacheKeyElements)
  }

  async getCacheKeyAsync(
    sourceText: string,
    sourcePath: string,
    transformOptions: TransformOptionsTsJest,
  ): Promise<string> {
    return new Promise((resolve) => resolve(this.getCacheKey(sourceText, sourcePath, transformOptions)))
  }

  /**
   * Subclasses extends `TsJestTransformer` can call this method to get resolved module disk cache
   */
  private _getFsCachedResolvedModules(configSet: ConfigSet): void {
    const cacheDir = configSet.tsCacheDir
    if (!configSet.isolatedModules && cacheDir) {
      // Make sure the cache directory exists before continuing.
      mkdirSync(cacheDir, { recursive: true })
      this._tsResolvedModulesCachePath = path.join(cacheDir, sha1('ts-jest-resolved-modules', CACHE_KEY_EL_SEPARATOR))
      try {
        const cachedTSResolvedModules = readFileSync(this._tsResolvedModulesCachePath, 'utf-8')
        this._depGraphs = new Map(parse(cachedTSResolvedModules))
      } catch (e) {}
    }
  }
}
