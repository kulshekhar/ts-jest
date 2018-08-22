import { TsJestGlobalOptions } from './types'
import { sha1 } from './util/sha1'
import { JsonableValue } from './util/jsonable-value'
import { ConfigSet } from './config/config-set'
import { stringify, parse } from './util/json'
import { inspect } from 'util'

/**
 * @internal
 */
export const INSPECT_CUSTOM = inspect.custom || 'inspect'

interface ConfigSetIndexItem {
  configSet: ConfigSet
  jestConfig: JsonableValue<jest.ProjectConfig>
}

export class TsJestTransformer implements jest.Transformer {
  protected static _lastTransformerId: number = 0
  static get lastTransformerId() {
    return TsJestTransformer._lastTransformerId
  }
  protected static get _nextTransformerId() {
    return ++TsJestTransformer._lastTransformerId
  }

  readonly id: number
  readonly options: TsJestGlobalOptions

  private _configSetsIndex: ConfigSetIndexItem[] = []

  constructor(baseOptions: TsJestGlobalOptions = {}) {
    this.options = { ...baseOptions }
    this.id = TsJestTransformer._nextTransformerId
  }

  [INSPECT_CUSTOM]() {
    return `[object TsJestTransformer<#${this.id}>]`
  }

  configsFor(jestConfig: jest.ProjectConfig | string) {
    let csi: ConfigSetIndexItem | undefined
    let jestConfigObj: jest.ProjectConfig
    if (typeof jestConfig === 'string') {
      csi = this._configSetsIndex.find(
        cs => cs.jestConfig.serialized === jestConfig,
      )
      if (csi) return csi.configSet
      jestConfigObj = parse(jestConfig)
    } else {
      csi = this._configSetsIndex.find(cs => cs.jestConfig.value === jestConfig)
      if (csi) return csi.configSet
      // try to look-it up by stringified version
      const serialized = stringify(jestConfig)
      csi = this._configSetsIndex.find(
        cs => cs.jestConfig.serialized === serialized,
      )
      if (csi) {
        // update the object so that we can find it later
        // this happens because jest first calls getCacheKey with stringified version of
        // the config, and then it calls the tranformer with the proper object
        csi.jestConfig.value = jestConfig
        return csi.configSet
      }
      jestConfigObj = jestConfig
    }

    // create the new record in the index
    const configSet = new ConfigSet(jestConfigObj, this.options)
    this._configSetsIndex.push({
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
      result = babelJest.process(result, filePath, jestConfig, transformOptions)
    }

    // allows hooks (usefull for testing)
    if (hooks.afterProcess) {
      const newResult = hooks.afterProcess(
        [input, filePath, jestConfig, transformOptions],
        result,
      )
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
    const configs = this.configsFor(jestConfigStr)
    const { instrument = false } = transformOptions
    return sha1(
      configs.cacheKey,
      '\x00',
      `instrument:${instrument ? 'on' : 'off'}`,
      '\x00',
      fileContent,
      '\x00',
      filePath,
    )
  }

  // we let jest doing the instrumentation, it does it well
  // get canInstrument() {}
}
