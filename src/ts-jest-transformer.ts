import type { TransformedSource, Transformer, TransformOptions } from '@jest/transform'
import type { Config } from '@jest/types'
import type { Logger } from 'bs-logger'
import { existsSync, readFileSync, statSync, writeFile } from 'fs'
import mkdirp from 'mkdirp'
import { join } from 'path'

import { TsJestCompiler } from './compiler/ts-jest-compiler'
import { ConfigSet } from './config/config-set'
import { DECLARATION_TYPE_EXT, JS_JSX_REGEX, TS_TSX_REGEX } from './constants'
import { parse, stringify } from './utils/json'
import { JsonableValue } from './utils/jsonable-value'
import { rootLogger } from './utils/logger'
import { Errors, interpolate } from './utils/messages'
import type { CompilerInstance } from './types'
import { sha1 } from './utils/sha1'
import { VersionCheckers } from './utils/version-checkers'

interface CachedConfigSet {
  configSet: ConfigSet
  jestConfig: JsonableValue<Config.ProjectConfig>
  transformerCfgStr: string
  compiler: CompilerInstance
}

export interface DepGraphInfo {
  fileContent: string
  resolveModuleNames: string[]
}

export const CACHE_KEY_EL_SEPARATOR = '\x00'

export class TsJestTransformer implements Transformer {
  /**
   * cache ConfigSet between test runs
   *
   * @internal
   */
  private static readonly _cachedConfigSets: CachedConfigSet[] = []
  /**
   * @internal
   */
  private _compiler!: CompilerInstance
  protected readonly _logger: Logger
  protected _tsResolvedModulesCachePath: string | undefined
  protected _transformCfgStr!: string
  protected _depGraphs: Map<string, DepGraphInfo> = new Map<string, DepGraphInfo>()

  constructor() {
    this._logger = rootLogger.child({ namespace: 'ts-jest-transformer' })
    VersionCheckers.jest.warn()

    this._logger.debug('created new transformer')
  }

  protected _configsFor(jestConfig: Config.ProjectConfig): ConfigSet {
    const ccs: CachedConfigSet | undefined = TsJestTransformer._cachedConfigSets.find(
      (cs) => cs.jestConfig.value === jestConfig,
    )
    let configSet: ConfigSet
    if (ccs) {
      this._transformCfgStr = ccs.transformerCfgStr
      this._compiler = ccs.compiler
      configSet = ccs.configSet
    } else {
      // try to look-it up by stringified version
      const serializedJestCfg = stringify(jestConfig)
      const serializedCcs = TsJestTransformer._cachedConfigSets.find(
        (cs) => cs.jestConfig.serialized === serializedJestCfg,
      )
      if (serializedCcs) {
        // update the object so that we can find it later
        // this happens because jest first calls getCacheKey with stringified version of
        // the config, and then it calls the transformer with the proper object
        serializedCcs.jestConfig.value = jestConfig
        this._transformCfgStr = serializedCcs.transformerCfgStr
        this._compiler = serializedCcs.compiler
        configSet = serializedCcs.configSet
      } else {
        // create the new record in the index
        this._logger.info('no matching config-set found, creating a new one')

        configSet = new ConfigSet(jestConfig)
        const jest = { ...jestConfig }
        // we need to remove some stuff from jest config
        // this which does not depend on config
        jest.name = undefined as any
        jest.cacheDirectory = undefined as any
        this._transformCfgStr = new JsonableValue({
          digest: configSet.tsJestDigest,
          babel: configSet.babelConfig,
          ...jest,
          tsconfig: {
            options: configSet.parsedTsConfig.options,
            raw: configSet.parsedTsConfig.raw,
          },
        }).serialized
        this._compiler = new TsJestCompiler(configSet)
        TsJestTransformer._cachedConfigSets.push({
          jestConfig: new JsonableValue(jestConfig),
          configSet,
          transformerCfgStr: this._transformCfgStr,
          compiler: this._compiler,
        })
        this._getFsCachedResolvedModules(configSet)
      }
    }

    return configSet
  }

  /**
   * @public
   */
  process(fileContent: string, filePath: Config.Path, transformOptions: TransformOptions): TransformedSource | string {
    this._logger.debug({ fileName: filePath, transformOptions }, 'processing', filePath)

    let result: string | TransformedSource
    const jestConfig = transformOptions.config
    const configs = this._configsFor(jestConfig)
    const { hooks } = configs
    const shouldStringifyContent = configs.shouldStringifyContent(filePath)
    const babelJest = shouldStringifyContent ? undefined : configs.babelJestTransformer
    const isDefinitionFile = filePath.endsWith(DECLARATION_TYPE_EXT)
    const isJsFile = JS_JSX_REGEX.test(filePath)
    const isTsFile = !isDefinitionFile && TS_TSX_REGEX.test(filePath)
    if (shouldStringifyContent) {
      // handles here what we should simply stringify
      result = `module.exports=${stringify(fileContent)}`
    } else if (isDefinitionFile) {
      // do not try to compile declaration files
      result = ''
    } else if (!configs.parsedTsConfig.options.allowJs && isJsFile) {
      // we've got a '.js' but the compiler option `allowJs` is not set or set to false
      this._logger.warn({ fileName: filePath }, interpolate(Errors.GotJsFileButAllowJsFalse, { path: filePath }))

      result = fileContent
    } else if (isJsFile || isTsFile) {
      // transpile TS code (source maps are included)
      result = this._compiler.getCompiledOutput(fileContent, filePath)
    } else {
      // we should not get called for files with other extension than js[x], ts[x] and d.ts,
      // TypeScript will bail if we try to compile, and if it was to call babel, users can
      // define the transform value with `babel-jest` for this extension instead
      const message = babelJest ? Errors.GotUnknownFileTypeWithBabel : Errors.GotUnknownFileTypeWithoutBabel

      this._logger.warn({ fileName: filePath }, interpolate(message, { path: filePath }))

      result = fileContent
    }
    // calling babel-jest transformer
    if (babelJest) {
      this._logger.debug({ fileName: filePath }, 'calling babel-jest processor')

      // do not instrument here, jest will do it anyway afterwards
      result = babelJest.process(result, filePath, { ...transformOptions, instrument: false })
    }
    // allows hooks (useful for internal testing)
    /* istanbul ignore next (cover by e2e) */
    if (hooks.afterProcess) {
      this._logger.debug({ fileName: filePath, hookName: 'afterProcess' }, 'calling afterProcess hook')

      const newResult = hooks.afterProcess([fileContent, filePath, jestConfig, transformOptions], result)
      if (newResult !== undefined) {
        return newResult
      }
    }

    return result
  }

  /**
   * Jest uses this to cache the compiled version of a file
   *
   * @see https://github.com/facebook/jest/blob/v23.5.0/packages/jest-runtime/src/script_transformer.js#L61-L90
   *
   * @public
   */
  getCacheKey(fileContent: string, filePath: string, transformOptions: TransformOptions): string {
    const configs = this._configsFor(transformOptions.config)

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
    if (!configs.isolatedModules) {
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
          .resolveModuleNames.filter((moduleName) => existsSync(moduleName))
      } else {
        this._logger.debug(
          { fileName: filePath, transformOptions },
          'getting resolved modules from TypeScript API for',
          filePath,
        )

        const resolvedModuleMap = this._compiler.getResolvedModulesMap(fileContent, filePath)
        resolvedModuleNames = resolvedModuleMap
          ? [...resolvedModuleMap.values()]
              .filter((resolvedModule) => resolvedModule !== undefined)
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              .map((resolveModule) => resolveModule!.resolvedFileName)
          : []
        this._depGraphs.set(filePath, {
          fileContent,
          resolveModuleNames: resolvedModuleNames,
        })
        /* istanbul ignore next */
        if (this._tsResolvedModulesCachePath) {
          // Cache resolved modules to disk so next run can reuse it
          void (async () => {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await writeFile(this._tsResolvedModulesCachePath as string, stringify([...this._depGraphs]), () => {})
          })()
        }
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

  /**
   * Subclasses extends `TsJestTransformer` can call this method to get resolved module disk cache
   */
  protected _getFsCachedResolvedModules(configSet: ConfigSet): void {
    const cacheDir = configSet.tsCacheDir
    if (!configSet.isolatedModules && cacheDir) {
      // Make sure the cache directory exists before continuing.
      mkdirp.sync(cacheDir)
      this._tsResolvedModulesCachePath = join(cacheDir, sha1('ts-jest-resolved-modules', CACHE_KEY_EL_SEPARATOR))
      try {
        const cachedTSResolvedModules = readFileSync(this._tsResolvedModulesCachePath, 'utf-8')
        this._depGraphs = new Map(parse(cachedTSResolvedModules))
      } catch (e) {}
    }
  }
}
