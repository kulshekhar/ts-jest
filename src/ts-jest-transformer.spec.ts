import fs from 'fs'
import { join } from 'path'

import { Logger, LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'
import mkdirp from 'mkdirp'
import { Extension, ResolvedModuleFull } from 'typescript'

import { createConfigSet } from './__helpers__/fakers'
import { logTargetMock } from './__helpers__/mocks'
import { SOURCE_MAPPING_PREFIX } from './compiler/compiler-utils'
import { TsCompiler } from './compiler/ts-compiler'
import { TsJestCompiler } from './compiler/ts-jest-compiler'
import { ConfigSet } from './config/config-set'
import { CACHE_KEY_EL_SEPARATOR, TsJestTransformer } from './ts-jest-transformer'
import type { ProjectConfigTsJest, ResolvedModulesMap, StringMap } from './types'
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
    const obj1 = {
      config: { cwd: process.cwd(), extensionsToTreatAsEsm: [], globals: {}, testMatch: [], testRegex: [] },
      cacheFS: new Map(),
    }

    test('should cache necessary things', () => {
      // @ts-expect-error testing purpose
      new TsJestTransformer()._configsFor(obj1)

      // @ts-expect-error testing purpose
      expect(Object.keys(TsJestTransformer._cachedConfigSets[0])).toMatchInlineSnapshot(`
Array [
  "jestConfig",
  "configSet",
  "transformerCfgStr",
  "compiler",
  "depGraphs",
  "tsResolvedModulesCachePath",
]
`)
    })

    test(
      'should return the same config set for same values with different jest config objects' +
        ' but their serialized versions are the same',
      () => {
        const obj2 = { ...obj1, config: { ...obj1.config, globals: Object.create(null) } }
        // @ts-expect-error testing purpose
        const cs1 = new TsJestTransformer()._configsFor(obj1)
        // @ts-expect-error testing purpose
        const cs2 = new TsJestTransformer()._configsFor(obj2)

        expect(cs2).toBe(cs1)
      },
    )

    test('should return the same config set for same values with jest config objects', () => {
      const obj2 = { ...obj1 }
      // @ts-expect-error testing purpose
      const cs1 = new TsJestTransformer()._configsFor(obj1)
      // @ts-expect-error testing purpose
      const cs2 = new TsJestTransformer()._configsFor(obj2)

      expect(cs2).toBe(cs1)
    })

    test(`should not read disk cache with isolatedModules true`, () => {
      const tr = new TsJestTransformer()
      const cs = createConfigSet({
        jestConfig: {
          globals: { 'ts-jest': { isolatedModules: true } },
        },
      })
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync')

      // @ts-expect-error testing purpose
      tr._getFsCachedResolvedModules(cs)

      expect(readFileSyncSpy).not.toHaveBeenCalled()

      readFileSyncSpy.mockRestore()
    })

    test(`should not read disk cache with isolatedModules false and no jest cache`, () => {
      const tr = new TsJestTransformer()
      const cs = createConfigSet({
        jestConfig: {
          globals: { 'ts-jest': { isolatedModules: false } },
        },
      })
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
      const cs = createConfigSet({
        jestConfig: {
          cache: true,
          cacheDirectory: cacheDir,
          globals: { 'ts-jest': { isolatedModules: false } },
        },
      })
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
      transformOptions: {
        configString: '{"foo": "bar"}',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { foo: 'bar', testMatch: [], testRegex: [], extensionsToTreatAsEsm: [] } as any,
        instrument: false,
        rootDir: '/foo',
        cacheFS: new Map(),
      },
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const transformOptionsWithCache = {
      ...input.transformOptions,
      config: {
        ...input.transformOptions.config,
        cache: true,
        cacheDirectory: cacheDir,
      },
    }
    const depGraphs: ResolvedModulesMap = new Map<string, ResolvedModuleFull | undefined>()

    beforeEach(() => {
      depGraphs.clear()
      // @ts-expect-error testing purpose
      TsJestTransformer._cachedConfigSets = []
      tr = new TsJestTransformer()
    })

    afterEach(() => {
      removeSync(cacheDir)
      jest.restoreAllMocks()
    })

    test('should be different for each argument value', () => {
      const keys = [
        tr.getCacheKey(input.fileContent, input.fileName, input.transformOptions),
        tr.getCacheKey(input.fileContent, 'bar.ts', input.transformOptions),
        tr.getCacheKey(input.fileContent, input.fileName, {
          ...input.transformOptions,
          config: { ...input.transformOptions.config, instrument: true },
        }),
        tr.getCacheKey(input.fileContent, input.fileName, {
          ...input.transformOptions,
          config: { ...input.transformOptions.config, rootDir: '/bar' },
        }),
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

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(cacheKey1).toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
    })

    test('should be different between isolatedModules true and isolatedModules false', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, {
        ...input.transformOptions,
        config: {
          ...input.transformOptions.config,
          globals: { 'ts-jest': { isolatedModules: true } },
        },
      })

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)
      const tr1 = new TsJestTransformer()
      const cacheKey2 = tr1.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
      expect(cacheKey1).not.toEqual(cacheKey2)
    })

    test('should be different with different file content for the same file', () => {
      depGraphs.set(input.fileName, resolvedModule)
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(depGraphs)
      const newFileContent = 'const foo = 1'
      const cacheKey2 = tr.getCacheKey(newFileContent, input.fileName, transformOptionsWithCache)

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

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(cacheKey1).not.toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModulesMap).toHaveBeenCalledWith(input.fileContent, input.fileName)
    })
  })

  describe('process', () => {
    const baseTransformOptions = {
      config: {
        testMatch: [],
        testRegex: [],
        extensionsToTreatAsEsm: [],
      },
      cacheFS: new Map(),
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    let tr!: TsJestTransformer

    beforeEach(() => {
      tr = new TsJestTransformer()
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModulesMap').mockReturnValueOnce(new Map())
    })

    test('should process input as stringified content with content matching stringifyContentPathRegex option', () => {
      const filePath = 'foo.html'
      const fileContent = '<h1>Hello World</h1>'
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': {
              stringifyContentPathRegex: '\\.html$',
            },
          },
        },
      }
      tr.getCacheKey(fileContent, filePath, transformOptions)

      const result = tr.process(fileContent, filePath, transformOptions)

      expect(result).toMatchInlineSnapshot(`"module.exports=\\"<h1>Hello World</h1>\\""`)
    })

    test('should process type definition input', () => {
      const fileContent = 'type Foo = number'
      const filePath = 'foo.d.ts'
      tr.getCacheKey(fileContent, filePath, baseTransformOptions)
      const result = tr.process(fileContent, filePath, baseTransformOptions)

      expect(result).toEqual('')
    })

    test('should process js file with allowJs false and show warning log', () => {
      const fileContent = 'const foo = 1'
      const filePath = 'foo.js'
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': { tsconfig: { allowJs: false } },
          },
        },
      }
      tr.getCacheKey(fileContent, filePath, transformOptions)
      logTarget.clear()

      const result = tr.process(fileContent, filePath, transformOptions)

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
      tr.getCacheKey(fileContent, filePath, baseTransformOptions)
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce(output)

      const result = tr.process(fileContent, filePath, baseTransformOptions)

      expect(result).toEqual(output)
    })

    test.each(['foo.js', 'foo.jsx'])('should process js/jsx file with allowJs true', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': { tsconfig: { allowJs: true } },
          },
        },
      }
      tr.getCacheKey(fileContent, filePath, transformOptions)
      logTarget.clear()
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce(output)

      const result = tr.process(fileContent, filePath, transformOptions)

      expect(result).toEqual(output)
    })

    test('should process file with unknown extension and show warning message without babel-jest', () => {
      const fileContent = 'foo'
      const filePath = 'foo.bar'
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': { tsconfig: { allowJs: true } },
          },
        },
      }
      tr.getCacheKey(fileContent, filePath, transformOptions)
      logTarget.clear()

      const result = tr.process(fileContent, filePath, transformOptions)

      expect(result).toEqual(fileContent)
      expect(logTarget.lines[1]).toMatchInlineSnapshot(`
        "[level:40] Got a unknown file type to compile (file: foo.bar). To fix this, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match this kind of files anymore.
        "
      `)
    })

    test.each(['foo.bar', 'foo.js'])('should process file with babel-jest', (filePath) => {
      const fileContent = 'foo'
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': { babelConfig: true },
          },
        },
      }
      tr.getCacheKey(fileContent, filePath, transformOptions)
      logTarget.clear()

      const result = tr.process('foo', filePath, transformOptions)

      if (typeof result !== 'string') {
        expect(result.code.substring(0, result.code.indexOf(SOURCE_MAPPING_PREFIX))).toMatchSnapshot()
      }
      if (filePath === 'foo.bar') {
        expect(logTarget.filteredLines(LogLevels.warn)[0]).toMatchSnapshot()
      }
    })
  })

  describe('subclass extends TsJestTransformer', () => {
    class MyTsCompiler extends TsCompiler {
      constructor(readonly configSet: ConfigSet, readonly jestCacheFS: StringMap) {
        super(configSet, jestCacheFS)
      }
    }

    class MyConfigSet extends ConfigSet {
      constructor(readonly jestConfig: ProjectConfigTsJest, readonly parentLogger?: Logger) {
        super(jestConfig, parentLogger)
      }
    }

    class MyTransformer extends TsJestTransformer {
      // eslint-disable-next-line class-methods-use-this
      protected _createCompiler(configSet: ConfigSet, cacheFS: Map<string, string>): void {
        // @ts-expect-error testing purpose
        this._compiler = new MyTsCompiler(configSet, cacheFS)
      }

      // eslint-disable-next-line class-methods-use-this
      protected _createConfigSet(config: ProjectConfigTsJest): MyConfigSet {
        return new MyConfigSet(config)
      }
    }
    let tr: MyTransformer

    beforeEach(() => {
      tr = new MyTransformer()
    })

    test('should have jest version checking', () => {
      VersionCheckers.jest.warn = jest.fn()

      new MyTransformer()

      expect(VersionCheckers.jest.warn).toHaveBeenCalled()
    })

    test('should create MyTsCompiler instance', () => {
      // @ts-expect-error testing purpose
      tr._createCompiler(createConfigSet(), new Map())

      // @ts-expect-error testing purpose
      expect(tr._compiler).toBeInstanceOf(MyTsCompiler)
    })

    test('should create MyConfigSet instance', () => {
      expect(
        // @ts-expect-error testing purpose
        tr._createConfigSet({
          cwd: process.cwd(),
          extensionsToTreatAsEsm: [],
          globals: Object.create(null),
          testMatch: [],
          testRegex: [],
        }),
      ).toBeInstanceOf(MyConfigSet)
    })
  })
})
