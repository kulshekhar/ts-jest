import { LogLevels } from 'bs-logger'
import fs from 'fs'
import { removeSync, writeFileSync } from 'fs-extra'
import mkdirp from 'mkdirp'
import { join, sep } from 'path'
import { Extension, ResolvedModuleFull } from 'typescript'

import { SOURCE_MAPPING_PREFIX } from './compiler/compiler-utils'
import { TsJestCompiler } from './compiler/ts-jest-compiler'
import { ConfigSet } from './config/config-set'
import { logTargetMock } from './__helpers__/mocks'
import { CACHE_KEY_EL_SEPARATOR, TsJestTransformer } from './ts-jest-transformer'
import type { ResolvedModulesMap } from './types'
import { stringify } from './utils/json'
import { sha1 } from './utils/sha1'
import { VersionCheckers } from './utils/version-checkers'

const logTarget = logTargetMock()
const cacheDir = join(process.cwd(), 'tmp')
const resolvedModule = {
  resolvedFileName: join(__dirname, '__mocks__', 'thing.ts'),
  extension: Extension.Ts,
  isExternalLibraryImport: false,
  packageId: undefined,
}

beforeEach(() => {
  logTarget.clear()
})

describe('TsJestTransformer', () => {
  describe('_configsFor', () => {
    test('should return the same config set for same values with jest config string is not in configSetsIndex', () => {
      const obj1 = { cwd: '/foo/.', rootDir: '/bar//dummy/..', globals: {} }
      // @ts-expect-error testing purpose
      const cs3 = new TsJestTransformer()._configsFor(obj1 as any)

      expect(cs3.cwd).toBe(`${sep}foo`)
      expect(cs3.rootDir).toBe(`${sep}bar`)
    })

    test('should return the same config set for same values with jest config string in configSetsIndex', () => {
      const obj1 = { cwd: '/foo/.', rootDir: '/bar//dummy/..', globals: {} }
      const obj2 = { ...obj1 }
      // @ts-expect-error testing purpose
      const cs1 = new TsJestTransformer()._configsFor(obj1 as any)
      // @ts-expect-error testing purpose
      const cs2 = new TsJestTransformer()._configsFor(obj2 as any)

      expect(cs1.cwd).toBe(`${sep}foo`)
      expect(cs1.rootDir).toBe(`${sep}bar`)
      expect(cs2).toBe(cs1)
    })

    test(`should not read disk cache with isolatedModules true`, () => {
      const tr = new TsJestTransformer()
      const cs = new ConfigSet({
        testMatch: [],
        testRegex: [],
        globals: { 'ts-jest': { isolatedModules: true } },
      } as any)
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync')

      // @ts-expect-error testing purpose
      tr._getFsCachedResolvedModules(cs)

      expect(readFileSyncSpy).not.toHaveBeenCalled()

      readFileSyncSpy.mockRestore()
    })

    test(`should not read disk cache with isolatedModules false and no jest cache`, () => {
      const tr = new TsJestTransformer()
      const cs = new ConfigSet({
        testMatch: [],
        testRegex: [],
        globals: { 'ts-jest': { isolatedModules: false } },
      } as any)
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync')

      // @ts-expect-error testing purpose
      tr._getFsCachedResolvedModules(cs)

      expect(readFileSyncSpy).not.toHaveBeenCalled()

      readFileSyncSpy.mockRestore()
    })

    test(`should read disk cache with isolatedModules false and use jest cache`, () => {
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync')
      const fileName = 'foo.ts'
      const tr = new TsJestTransformer()
      const cs = new ConfigSet({
        cache: true,
        cacheDirectory: cacheDir,
        globals: { 'ts-jest': { isolatedModules: false } },
        testMatch: [],
        testRegex: [],
      } as any)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tsCacheDir = cs.tsCacheDir!
      const depGraphs: ResolvedModulesMap = new Map<string, ResolvedModuleFull | undefined>()
      depGraphs.set(fileName, resolvedModule)
      const resolvedModulesCacheDir = join(tsCacheDir, sha1('ts-jest-resolved-modules', CACHE_KEY_EL_SEPARATOR))
      mkdirp.sync(tsCacheDir)
      writeFileSync(resolvedModulesCacheDir, stringify([...depGraphs]))

      // @ts-expect-error testing purpose
      tr._getFsCachedResolvedModules(cs)

      // @ts-expect-error testing purpose
      expect(tr._depGraphs.has(fileName)).toBe(true)
      expect(readFileSyncSpy.mock.calls).toEqual(expect.arrayContaining([[resolvedModulesCacheDir, 'utf-8']]))

      removeSync(cacheDir)
    })
  })

  describe('getCacheKey', () => {
    let tr: TsJestTransformer
    const input = {
      fileContent: 'export default "foo"',
      fileName: 'foo.ts',
      jestConfigStr: '{"foo": "bar"}',
      options: { config: { foo: 'bar', testMatch: [], testRegex: [] } as any, instrument: false, rootDir: '/foo' },
    }
    const depGraphs: ResolvedModulesMap = new Map<string, ResolvedModuleFull | undefined>()

    beforeEach(() => {
      depGraphs.clear()
      tr = new TsJestTransformer()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should be different for each argument value', () => {
      const keys = [
        tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options),
        tr.getCacheKey(input.fileContent, 'bar.ts', input.jestConfigStr, input.options),
        tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, instrument: true }),
        tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, rootDir: '/bar' }),
      ]

      // each key should have correct length
      for (const key of keys) {
        expect(key).toHaveLength(40)
      }
      // unique array should have same length
      expect(keys.filter((k, i, all) => all.indexOf(k) === i)).toHaveLength(keys.length)
    })

    test('should be the same with the same file content', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)

      expect(cacheKey1).toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
    })

    test('should be different between isolatedModules true and isolatedModules false', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, {
        ...input.options,
        config: {
          ...input.options.config,
          globals: { 'ts-jest': { isolatedModules: true } },
        },
      })

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)
      const tr1 = new TsJestTransformer()
      const cacheKey2 = tr1.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)

      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
      expect(cacheKey1).not.toEqual(cacheKey2)
    })

    test('should be different with different file content for the same file', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)
      const newFileContent = 'const foo = 1'
      const cacheKey2 = tr.getCacheKey(newFileContent, input.fileName, input.jestConfigStr, input.options)

      expect(cacheKey1).not.toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenNthCalledWith(
        1,
        input.fileContent,
        input.fileName,
      )
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenNthCalledWith(2, newFileContent, input.fileName)
    })

    test('should be different with non existed imported modules', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)

      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options)

      expect(cacheKey1).not.toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
    })
  })

  describe('process', () => {
    let tr!: TsJestTransformer

    beforeEach(() => {
      tr = new TsJestTransformer()
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(new Map())
    })

    test('should process input as stringified content with content matching stringifyContentPathRegex option', () => {
      const filePath = 'foo.html'
      const fileContent = '<h1>Hello World</h1>'
      const jestCfg = {
        globals: {
          'ts-jest': {
            stringifyContentPathRegex: '\\.html$',
          },
        },
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toMatchInlineSnapshot(`"module.exports=\\"<h1>Hello World</h1>\\""`)
    })

    test('should process type definition input', () => {
      const fileContent = 'type Foo = number'
      const filePath = 'foo.d.ts'
      const jestCfg = {
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual('')
    })

    test('should process js file with allowJs false and show warning log', () => {
      const fileContent = 'const foo = 1'
      const filePath = 'foo.js'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: false } },
        },
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      logTarget.clear()

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(fileContent)
      expect(logTarget.lines[1].substring(0)).toMatchInlineSnapshot(`
        "[level:40] Got a \`.js\` file to compile while \`allowJs\` option is not set to \`true\` (file: foo.js). To fix this:
          - if you want TypeScript to process JS files, set \`allowJs\` to \`true\` in your TypeScript config (usually tsconfig.json)
          - if you do not want TypeScript to process your \`.js\` files, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match \`.js\` files anymore
        "
      `)
    })

    test.each(['foo.ts', 'foo.tsx'])('should process ts/tsx file', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      const jestCfg = {
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce(output)

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(output)
    })

    test.each(['foo.js', 'foo.jsx'])('should process js/jsx file with allowJs true', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: true } },
        },
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      logTarget.clear()
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce(output)

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(output)
    })

    test('should process file with unknown extension and show warning message without babel-jest', () => {
      const fileContent = 'foo'
      const filePath = 'foo.bar'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: true } },
        },
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      logTarget.clear()

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(fileContent)
      expect(logTarget.lines[1]).toMatchInlineSnapshot(`
        "[level:40] Got a unknown file type to compile (file: foo.bar). To fix this, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match this kind of files anymore.
        "
      `)
    })

    test.each(['foo.bar', 'foo.js'])('should process file with babel-jest', (filePath) => {
      const fileContent = 'foo'
      const jestCfg = {
        globals: {
          'ts-jest': { babelConfig: true },
        },
        testMatch: [],
        testRegex: [],
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      logTarget.clear()

      const result = tr.process('foo', filePath, jestCfg)

      if (typeof result !== 'string') {
        expect(result.code.substring(0, result.code.indexOf(SOURCE_MAPPING_PREFIX))).toMatchSnapshot()
      }
      if (filePath === 'foo.bar') {
        expect(logTarget.filteredLines(LogLevels.warn)[0]).toMatchSnapshot()
      }
    })
  })

  describe('subclass extends TsJestTransformer', () => {
    class MyTransformer extends TsJestTransformer {}

    test('should have jest version checking', () => {
      VersionCheckers.jest.warn = jest.fn()

      new MyTransformer()

      expect(VersionCheckers.jest.warn).toHaveBeenCalled()
    })
  })
})
