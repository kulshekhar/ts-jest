import { createConfigSet } from '../../__helpers__/fakers'

import { TsCompiler } from './ts-compiler'
import { TsJestCompiler } from './ts-jest-compiler'

describe('TsJestCompiler', () => {
  TsCompiler.prototype.getResolvedModules = jest.fn()
  TsCompiler.prototype.getCompiledOutput = jest.fn()
  const runtimeCacheFS = new Map<string, string>()
  const fileContent = 'const foo = 1'
  const fileName = 'foo.ts'
  const compiler = new TsJestCompiler(createConfigSet(), runtimeCacheFS)

  describe('getResolvedModules', () => {
    test('should call getResolvedModules from compiler instance', () => {
      compiler.getResolvedModules(fileContent, fileName, runtimeCacheFS)

      expect(TsCompiler.prototype.getResolvedModules).toHaveBeenCalledWith(fileContent, fileName, runtimeCacheFS)
    })
  })

  describe('getCompiledOutput', () => {
    test('should call getCompiledOutput from compiler instance', () => {
      compiler.getCompiledOutput(fileContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      })

      expect(TsCompiler.prototype.getCompiledOutput).toHaveBeenCalledWith(fileContent, fileName, {
        depGraphs: new Map(),
        supportsStaticESM: false,
        watchMode: false,
      })
    })
  })
})
