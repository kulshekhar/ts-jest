import { Logger } from 'bs-logger'
import { inspect } from 'util'

import { ConfigSet } from './config/config-set'
import { TsJestGlobalOptions } from './types'
import { parse, stringify } from './util/json'
import { JsonableValue } from './util/jsonable-value'
import { rootLogger } from './util/logger'
import { sha1 } from './util/sha1'

/**
 * @internal
 */
export const INSPECT_CUSTOM = inspect.custom || 'inspect'

interface ConfigSetIndexItem {
  configSet: ConfigSet
  jestConfig: JsonableValue<jest.ProjectConfig>
}

export class TsJestTransformer implements jest.Transformer {
  private static readonly _configSetsIndex: ConfigSetIndexItem[] = []
  private static _lastTransformerId = 0
  static get lastTransformerId() {
    return TsJestTransformer._lastTransformerId
  }
  private static get _nextTransformerId() {
    return ++TsJestTransformer._lastTransformerId
  }

  readonly logger: Logger
  readonly id: number
  readonly options: TsJestGlobalOptions

  constructor(baseOptions: TsJestGlobalOptions = {}) {
    this.options = { ...baseOptions }
    this.id = TsJestTransformer._nextTransformerId
    this.logger = rootLogger.child({
      transformerId: this.id,
      namespace: 'jest-transformer',
    })
    this.logger.debug({ baseOptions }, 'created new transformer')
  }

  /* istanbul ignore next */
  [INSPECT_CUSTOM]() {
    return `[object TsJestTransformer<#${this.id}>]`
  }

  configsFor(jestConfig: jest.ProjectConfig | string) {
    let csi: ConfigSetIndexItem | undefined
    let jestConfigObj: jest.ProjectConfig
    if (typeof jestConfig === 'string') {
      csi = TsJestTransformer._configSetsIndex.find(cs => cs.jestConfig.serialized === jestConfig)
      if (csi) return csi.configSet
      jestConfigObj = parse(jestConfig)
    } else {
      csi = TsJestTransformer._configSetsIndex.find(cs => cs.jestConfig.value === jestConfig)
      if (csi) return csi.configSet
      // try to look-it up by stringified version
      const serialized = stringify(jestConfig)
      csi = TsJestTransformer._configSetsIndex.find(cs => cs.jestConfig.serialized === serialized)
      if (csi) {
        // update the object so that we can find it later
        // this happens because jest first calls getCacheKey with stringified version of
        // the config, and then it calls the transformer with the proper object
        csi.jestConfig.value = jestConfig
        return csi.configSet
      }
      jestConfigObj = jestConfig
    }

    // create the new record in the index
    this.logger.info(`no matching config-set found, creating a new one`)
    const configSet = new ConfigSet(jestConfigObj, this.options, this.logger)
    TsJestTransformer._configSetsIndex.push({
      jestConfig: new JsonableValue(jestConfigObj),
      configSet,
    })
    return configSet
  }

  process(
    input: string,
    filePath: jest.Path,
    jestConfig: jest.ProjectConfig,
    transformOptions?: jest.TransformOptions,
  ): jest.TransformedSource | string {
    this.logger.debug({ fileName: filePath, transformOptions }, 'processing', filePath)
    let result: string | jest.TransformedSource
    let source: string = input

    const configs = this.configsFor(jestConfig)
    const { hooks } = configs

    const stringify = configs.shouldStringifyContent(filePath)
    const babelJest = stringify ? undefined : configs.babelJestTransformer

    // handles here what we should simply stringify
    if (stringify) {
      source = `module.exports=${JSON.stringify(source)}`
    }

    // transpile TS code (source maps are included)
    result = filePath.endsWith('.d.ts')
      ? '' // do not try to compile declaration files
      : configs.tsCompiler.compile(source, filePath)

    // calling babel-jest transformer
    if (babelJest) {
      this.logger.debug({ fileName: filePath }, 'calling babel-jest processor')
      result = babelJest.process(result, filePath, jestConfig, transformOptions)
    }

    // allows hooks (useful for testing)
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
   * @param fileContent The content of the file
   * @param filePath The full path to the file
   * @param jestConfigStr The JSON-encoded version of jest config
   * @param transformOptions.instrument Whether the content will be instrumented by our transformer (always false)
   * @param transformOptions.rootDir Jest current rootDir
   */
  getCacheKey(
    fileContent: string,
    filePath: string,
    jestConfigStr: string,
    transformOptions: { instrument?: boolean; rootDir?: string } = {},
  ): string {
    this.logger.debug({ fileName: filePath, transformOptions }, 'computing cache key for', filePath)
    const configs = this.configsFor(jestConfigStr)
    // we do not instrument, ensure it is false all the time
    const { instrument = false, rootDir = configs.rootDir } = transformOptions
    return sha1(
      configs.cacheKey,
      '\x00',
      rootDir,
      '\x00',
      `instrument:${instrument ? 'on' : 'off'}`,
      '\x00',
      fileContent,
      '\x00',
      filePath,
    )
  }
}
