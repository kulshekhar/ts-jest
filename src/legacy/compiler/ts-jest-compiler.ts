import type { TransformedSource } from '@jest/transform'

import type { CompilerInstance, StringMap, TsJestCompileOptions } from '../../types'
import type { ConfigSet } from '../config/config-set'

import { TsCompiler } from './ts-compiler'

export class TsJestCompiler implements CompilerInstance {
  private readonly _compilerInstance: CompilerInstance

  constructor(configSet: ConfigSet, runtimeCacheFS: StringMap) {
    // Later we can add swc/esbuild or other typescript compiler instance here
    this._compilerInstance = new TsCompiler(configSet, runtimeCacheFS)
  }

  getResolvedModules(fileContent: string, fileName: string, runtimeCacheFS: StringMap): string[] {
    return this._compilerInstance.getResolvedModules(fileContent, fileName, runtimeCacheFS)
  }

  getCompiledOutput(fileContent: string, fileName: string, options: TsJestCompileOptions): TransformedSource {
    return this._compilerInstance.getCompiledOutput(fileContent, fileName, options)
  }
}
