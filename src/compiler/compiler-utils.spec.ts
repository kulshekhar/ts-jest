import { logger } from 'bs-logger'
import * as fs from 'fs'
import { resolve } from 'path'

import { makeCompiler } from '../__helpers__/fakers'
import { tempDir } from '../__helpers__/path'
import { MemoryCache, TSFile } from '../types'

import { cacheResolvedModules, getResolvedModulesCache } from './compiler-utils'

const memoryCache: MemoryCache = {
  contents: Object.create(null),
  versions: Object.create(null),
  outputs: Object.create(null),
  resolvedModules: Object.create(null),
  files: new Map<string, TSFile>(),
}

describe('cacheResolvedModules', () => {
  let spy: jest.SpyInstance<void, any[]>

  beforeAll(() => {
    // tslint:disable-next-line:no-empty
    spy = jest.spyOn(fs, 'writeFileSync')
  })

  beforeEach(() => {
    memoryCache.resolvedModules = Object.create(null)
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('should store resolved modules in memory cache and file system when there are resolved modules', () => {
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/main.spec.ts'
    const source = JSON.stringify(require('../__mocks__/main.spec'))

    compiler.compile(source, fileName)
    cacheResolvedModules(fileName, source, memoryCache, compiler.program!, tmp, logger)

    expect(memoryCache.resolvedModules[fileName].modulePaths).toContain(resolve('src/__mocks__/main.ts'))
    expect(memoryCache.resolvedModules[fileName].testFileContent).toEqual(source)
    expect(spy).toHaveBeenCalledWith(getResolvedModulesCache(tmp), JSON.stringify(memoryCache.resolvedModules))
  })

  it(`should store resolved modules in memory cache but not file system when there aren't resolved modules`, () => {
    const tmp = tempDir('compiler')
    const compiler = makeCompiler({
      jestConfig: { cache: true, cacheDirectory: tmp },
      tsJestConfig: { tsConfig: false },
    })
    const fileName = 'src/__mocks__/thing.spec.ts'
    const source = JSON.stringify(require('../__mocks__/thing.spec'))

    compiler.compile(source, fileName)
    cacheResolvedModules(fileName, source, memoryCache, compiler.program!, tmp, logger)

    expect(memoryCache.resolvedModules[fileName]).toBeUndefined()
    expect(spy).not.toHaveBeenCalled()
  })
})
