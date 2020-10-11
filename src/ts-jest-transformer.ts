import createCacheKey from '@jest/create-cache-key-function'
import type { CacheKeyOptions, TransformedSource, Transformer, TransformOptions } from '@jest/transform'
import type { Config } from '@jest/types'
import type { Logger } from 'bs-logger'
import type { CompilerOptions } from 'typescript'

import { ConfigSet } from './config/config-set'
import { JS_JSX_REGEX, TS_TSX_REGEX } from './constants'
import { stringify } from './utils/json'
import { JsonableValue } from './utils/jsonable-value'
import { rootLogger } from './utils/logger'
import { Errors, interpolate } from './utils/messages'
import type { BabelConfig } from './types'

interface TransformerConfig extends Config.ProjectConfig {
  digest: string
  babel: BabelConfig | undefined
  tsconfig: {
    options: CompilerOptions
    raw: Record<string, any>
  }
}

interface CachedConfigSet {
  configSet: ConfigSet
  jestConfig: JsonableValue<Config.ProjectConfig>
  transformerConfig: JsonableValue<TransformerConfig>
}

export class TsJestTransformer implements Transformer {
  /**
   * cache ConfigSet between test runs
   */
  private static readonly _cachedConfigSets: CachedConfigSet[] = []
  protected readonly logger: Logger
  private _transformCfgStr!: string
  private _tsJestCfgSet!: ConfigSet

  constructor() {
    this.logger = rootLogger.child({ namespace: 'ts-jest-transformer' })

    this.logger.debug('created new transformer')
  }

  process(
    input: string,
    filePath: Config.Path,
    jestConfig: Config.ProjectConfig,
    transformOptions?: TransformOptions,
  ): TransformedSource | string {
    this.logger.debug({ fileName: filePath, transformOptions }, 'processing', filePath)

    let result: string | TransformedSource
    const source: string = input
    const { hooks } = this._tsJestCfgSet
    const shouldStringifyContent = this._tsJestCfgSet.shouldStringifyContent(filePath)
    const babelJest = shouldStringifyContent ? undefined : this._tsJestCfgSet.babelJestTransformer
    const isDefinitionFile = filePath.endsWith('.d.ts')
    const isJsFile = JS_JSX_REGEX.test(filePath)
    const isTsFile = !isDefinitionFile && TS_TSX_REGEX.test(filePath)
    if (shouldStringifyContent) {
      // handles here what we should simply stringify
      result = `module.exports=${stringify(source)}`
    } else if (isDefinitionFile) {
      // do not try to compile declaration files
      result = ''
    } else if (!this._tsJestCfgSet.parsedTsConfig.options.allowJs && isJsFile) {
      // we've got a '.js' but the compiler option `allowJs` is not set or set to false
      this.logger.warn({ fileName: filePath }, interpolate(Errors.GotJsFileButAllowJsFalse, { path: filePath }))

      result = source
    } else if (isJsFile || isTsFile) {
      // transpile TS code (source maps are included)
      /* istanbul ignore if */
      result = this._tsJestCfgSet.tsCompiler.compile(source, filePath)
    } else {
      // we should not get called for files with other extension than js[x], ts[x] and d.ts,
      // TypeScript will bail if we try to compile, and if it was to call babel, users can
      // define the transform value with `babel-jest` for this extension instead
      const message = babelJest ? Errors.GotUnknownFileTypeWithBabel : Errors.GotUnknownFileTypeWithoutBabel

      this.logger.warn({ fileName: filePath }, interpolate(message, { path: filePath }))

      result = source
    }
    // calling babel-jest transformer
    if (babelJest) {
      this.logger.debug({ fileName: filePath }, 'calling babel-jest processor')

      // do not instrument here, jest will do it anyway afterwards
      result = babelJest.process(result, filePath, jestConfig, { ...transformOptions, instrument: false })
    }
    // allows hooks (useful for internal testing)
    /* istanbul ignore next (cover by e2e) */
    if (hooks.afterProcess) {
      this.logger.debug({ fileName: filePath, hookName: 'afterProcess' }, 'calling afterProcess hook')

      const newResult = hooks.afterProcess([input, filePath, jestConfig, transformOptions], result)
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
   */
  getCacheKey(
    fileContent: string,
    filePath: string,
    _jestConfigStr: string,
    transformOptions: CacheKeyOptions,
  ): string {
    this.createOrResolveTransformerCfg(transformOptions.config)

    this.logger.debug({ fileName: filePath, transformOptions }, 'computing cache key for', filePath)

    return createCacheKey()(fileContent, filePath, this._transformCfgStr, {
      config: transformOptions.config,
      instrument: false,
    })
  }

  /**
   * Users can override this method and provide their own config class
   */
  protected createOrResolveTransformerCfg(jestConfig: Config.ProjectConfig): void {
    const ccs: CachedConfigSet | undefined = TsJestTransformer._cachedConfigSets.find(
      (cs) => cs.jestConfig.value === jestConfig,
    )
    if (ccs) {
      this._transformCfgStr = ccs.transformerConfig.serialized
      this._tsJestCfgSet = ccs.configSet
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
        this._transformCfgStr = serializedCcs.transformerConfig.serialized
        this._tsJestCfgSet = serializedCcs.configSet
      } else {
        // create the new record in the index
        this.logger.info('no matching config-set found, creating a new one')

        const configSet = new ConfigSet(jestConfig)
        const transformerCfg = new JsonableValue({
          digest: configSet.tsJestDigest,
          babel: configSet.babel,
          ...jestConfig,
          tsconfig: {
            options: configSet.parsedTsConfig.options,
            raw: configSet.parsedTsConfig.raw,
          },
        })
        TsJestTransformer._cachedConfigSets.push({
          jestConfig: new JsonableValue(jestConfig),
          configSet,
          transformerConfig: transformerCfg,
        })
        this._transformCfgStr = transformerCfg.serialized
        this._tsJestCfgSet = configSet
      }
    }
  }
}
