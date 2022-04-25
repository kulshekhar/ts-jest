import fs from 'fs'
import path from 'path'

import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'

import { createConfigSet } from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import type { DepGraphInfo } from '../types'
import { stringify } from '../utils'
import { importer } from '../utils/importer'
import { sha1 } from '../utils/sha1'

import { TsJestCompiler } from './compiler'
import { CACHE_KEY_EL_SEPARATOR, TsJestTransformer } from './ts-jest-transformer'

const SOURCE_MAPPING_PREFIX = 'sourceMappingURL='

const logTarget = logTargetMock()
const cacheDir = path.join(process.cwd(), 'tmp')
const baseTransformOptions = {
  config: {
    testMatch: [],
    testRegex: [],
    extensionsToTreatAsEsm: [],
  },
  cacheFS: new Map(),
} as any // eslint-disable-line @typescript-eslint/no-explicit-any

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
          "watchMode",
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
      const depGraphs: Map<string, DepGraphInfo> = new Map<string, DepGraphInfo>()
      depGraphs.set(fileName, {
        fileContent: 'const foo = 1',
        resolvedModuleNames: [],
      })
      const resolvedModulesCacheDir = path.join(tsCacheDir, sha1('ts-jest-resolved-modules', CACHE_KEY_EL_SEPARATOR))
      fs.mkdirSync(tsCacheDir, { recursive: true })
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

    beforeEach(() => {
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
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(cacheKey1).toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledWith(
        input.fileContent,
        input.fileName,
        new Map(),
      )
    })

    test('should be different between isolatedModules true and isolatedModules false', () => {
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, {
        ...input.transformOptions,
        config: {
          ...input.transformOptions.config,
          globals: { 'ts-jest': { isolatedModules: true } },
        },
      })

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])
      const tr1 = new TsJestTransformer()
      const cacheKey2 = tr1.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledWith(
        input.fileContent,
        input.fileName,
        new Map(),
      )
      expect(cacheKey1).not.toEqual(cacheKey2)
    })

    test('should be different with different file content for the same file', () => {
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])
      const newFileContent = 'const foo = 1'
      const cacheKey2 = tr.getCacheKey(newFileContent, input.fileName, transformOptionsWithCache)

      expect(cacheKey1).not.toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledTimes(2)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenNthCalledWith(
        1,
        input.fileContent,
        input.fileName,
        new Map(),
      )
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenNthCalledWith(
        2,
        newFileContent,
        input.fileName,
        new Map(),
      )
    })

    test('should be different with non existed imported modules', () => {
      jest
        .spyOn(TsJestCompiler.prototype, 'getResolvedModules')
        .mockReturnValueOnce([path.join(process.cwd(), 'src', '__mocks__', 'thing.ts')])

      const cacheKey1 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
      const cacheKey2 = tr.getCacheKey(input.fileContent, input.fileName, transformOptionsWithCache)

      expect(cacheKey1).not.toEqual(cacheKey2)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledTimes(1)
      expect(TsJestCompiler.prototype.getResolvedModules).toHaveBeenCalledWith(
        input.fileContent,
        input.fileName,
        new Map(),
      )
    })
  })

  describe('getCacheKeyAsync', () => {
    test('should call `getCacheKey` method', async () => {
      const sourceText = 'const foo = 1'
      const sourcePath = 'foo.ts'
      const tr = new TsJestTransformer()
      tr.getCacheKey = jest.fn()

      await tr.getCacheKeyAsync(sourceText, sourcePath, baseTransformOptions)

      expect(tr.getCacheKey).toHaveBeenCalledWith(sourceText, sourcePath, baseTransformOptions)
    })
  })

  describe('process', () => {
    let tr!: TsJestTransformer

    beforeEach(() => {
      tr = new TsJestTransformer()
      jest.spyOn(TsJestCompiler.prototype, 'getResolvedModules').mockReturnValueOnce([])
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

      expect(result).toMatchInlineSnapshot(`
        Object {
          "code": "module.exports=\\"<h1>Hello World</h1>\\"",
        }
      `)
    })

    test('should process type definition input', () => {
      const fileContent = 'type Foo = number'
      const filePath = 'foo.d.ts'
      tr.getCacheKey(fileContent, filePath, baseTransformOptions)
      const result = tr.process(fileContent, filePath, baseTransformOptions)

      expect(result).toEqual({
        code: '',
      })
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

      expect(result).toEqual({
        code: fileContent,
      })
      expect(logTarget.lines[1].substring(0)).toMatchInlineSnapshot(`
        "[level:40] Got a \`.js\` file to compile while \`allowJs\` option is not set to \`true\` (file: foo.js). To fix this:
          - if you want TypeScript to process JS files, set \`allowJs\` to \`true\` in your TypeScript config (usually tsconfig.json)
          - if you do not want TypeScript to process your \`.js\` files, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match \`.js\` files anymore
        "
      `)
    })

    test('should allow detection of ts-jest', () => {
      expect(process.env.TS_JEST).toBe('1')
    })

    test.each(['foo.ts', 'foo.tsx'])('should process ts/tsx file', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      tr.getCacheKey(fileContent, filePath, baseTransformOptions)
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce({
        code: output,
      })

      const result = tr.process(fileContent, filePath, baseTransformOptions)

      expect(result).toEqual({
        code: output,
      })
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
      jest.spyOn(TsJestCompiler.prototype, 'getCompiledOutput').mockReturnValueOnce({
        code: output,
      })

      const result = tr.process(fileContent, filePath, transformOptions)

      expect(result).toEqual({
        code: output,
      })
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

      expect(result).toEqual({
        code: fileContent,
      })
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

      expect(result.code.substring(0, result.code.indexOf(SOURCE_MAPPING_PREFIX))).toMatchSnapshot()
      if (filePath === 'foo.bar') {
        expect(logTarget.filteredLines(LogLevels.warn)[0]).toMatchSnapshot()
      }
    })

    test('should use afterHook file', () => {
      importer.tryTheseOr = jest.fn().mockReturnValueOnce({ afterProcess: () => 'foo' })
      process.env.TS_JEST_HOOKS = __filename

      const fileContent = 'type Foo = number'
      const filePath = 'foo.d.ts'

      expect(tr.process(fileContent, filePath, baseTransformOptions)).toEqual('foo')

      delete process.env.TS_JEST_HOOKS
    })
  })

  describe('processAsync', () => {
    test('should call `process` method', async () => {
      const sourceText = 'const foo = 1'
      const sourcePath = 'foo.ts'
      const tr = new TsJestTransformer()
      // @ts-expect-error `processWithTs` is private
      tr.processWithTs = jest.fn().mockReturnValueOnce('var foo = 1')
      const transformOptions = {
        ...baseTransformOptions,
        config: {
          ...baseTransformOptions.config,
          globals: {
            'ts-jest': {
              babelConfig: true,
            },
          },
        },
      }
      // @ts-expect-error `_configsFor` is private
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const babelJest = tr._configsFor(transformOptions).babelJestTransformer!
      jest.spyOn(babelJest, 'processAsync').mockResolvedValue({
        code: 'var foo = 1',
      })

      await tr.processAsync(sourceText, sourcePath, transformOptions)

      // @ts-expect-error `processWithTs` is private
      expect(tr.processWithTs).toHaveBeenCalledWith(sourceText, sourcePath, transformOptions)
      expect(babelJest.processAsync).toHaveBeenCalledWith(undefined, sourcePath, {
        ...transformOptions,
        instrument: false,
      })
    })
  })
})
