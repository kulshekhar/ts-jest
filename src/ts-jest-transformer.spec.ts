import { LogLevels } from 'bs-logger'

import { TsJestTransformer } from './ts-jest-transformer'
import { ConfigSet } from './config/config-set'
import { SOURCE_MAPPING_PREFIX } from './compiler/instance'
import { logTargetMock } from './__helpers__/mocks'

const logTarget = logTargetMock()

beforeEach(() => {
  logTarget.clear()
})

describe('TsJestTransformer', () => {
  describe('createOrResolveTransformerCfg', () => {
    it('should return the same config-set for same values with jest config string is not in cachedConfigSets', () => {
      const obj1 = { cwd: '/foo/.' } as any
      const tjT = new TsJestTransformer()

      logTarget.clear()

      tjT.getCacheKey('foo', 'foo', JSON.stringify(obj1), {
        config: obj1,
      } as any)

      expect(logTarget.lines[0]).toMatchInlineSnapshot(`
        "[level:30] no matching config-set found, creating a new one
        "
      `)
    })

    it('should return the same config-set for same values with jest config string in cachedConfigSets', () => {
      const obj1 = { cwd: '/foo/.', rootDir: '/bar//dummy/..', globals: {} }
      const obj2 = { ...obj1 }
      const tjT1 = new TsJestTransformer()
      const tjT2 = new TsJestTransformer()

      logTarget.clear()

      tjT1.getCacheKey('foo', 'foo', JSON.stringify(obj1), {
        config: obj1,
      } as any)
      tjT2.getCacheKey('foo', 'foo', JSON.stringify(obj2), {
        config: obj2,
      } as any)

      expect(logTarget.filteredLines(LogLevels.info)).toHaveLength(1)
    })
  })

  describe('getCacheKey', () => {
    it('should be different for each argument value', () => {
      const tr = new TsJestTransformer()
      const input = {
        fileContent: 'export default "foo"',
        fileName: 'foo.ts',
        jestConfigStr: '{"foo": "bar"}',
        options: { config: { foo: 'bar' } as any, instrument: false, rootDir: '/foo' },
      }
      const keys = [
        tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options),
        tr.getCacheKey(input.fileContent, 'bar.ts', input.jestConfigStr, input.options),
        tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, instrument: true }),
        tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, rootDir: '/bar' }),
      ]
      // each key should have correct length
      for (const key of keys) {
        expect(key).toHaveLength(32)
      }
    })
  })

  describe('process', () => {
    let tr: TsJestTransformer

    beforeEach(() => {
      tr = new TsJestTransformer()
    })

    it('should process input as stringified content with content matching stringifyContentPathRegex option', () => {
      const fileContent = '<h1>Hello World</h1>'
      const filePath = 'foo.html'
      const jestCfg = {
        globals: {
          'ts-jest': {
            stringifyContentPathRegex: '\\.html$',
          },
        },
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toMatchInlineSnapshot(`"module.exports=\\"<h1>Hello World</h1>\\""`)
    })

    it('should process type definition input', () => {
      const fileContent = 'type Foo = number'
      const filePath = 'foo.d.ts'
      const jestCfg = Object.create(null)
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual('')
    })

    it('should process js file with allowJs false and show warning log', () => {
      const fileContent = 'const foo = 1'
      const filePath = 'foo.js'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: false } },
        },
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

    it.each(['foo.ts', 'foo.tsx'])('should process ts/tsx file', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      const jestCfg = Object.create(null)
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      jest.spyOn(ConfigSet.prototype, 'tsCompiler', 'get').mockImplementationOnce(() => ({
        compile: () => output,
        cwd: '.',
        program: undefined,
      }))

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(output)
    })

    it.each(['foo.js', 'foo.jsx'])('should process js/jsx file with allowJs true', (filePath) => {
      const fileContent = 'const foo = 1'
      const output = 'var foo = 1'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: true } },
        },
      } as any
      tr.getCacheKey(fileContent, filePath, JSON.stringify(jestCfg), { config: jestCfg } as any)
      logTarget.clear()
      jest.spyOn(ConfigSet.prototype, 'tsCompiler', 'get').mockImplementationOnce(() => ({
        compile: () => output,
        cwd: '.',
        program: undefined,
      }))

      const result = tr.process(fileContent, filePath, jestCfg)

      expect(result).toEqual(output)
    })

    it('should process file with unknown extension and show warning message without babel-jest', () => {
      const fileContent = 'foo'
      const filePath = 'foo.bar'
      const jestCfg = {
        globals: {
          'ts-jest': { tsconfig: { allowJs: true } },
        },
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

    it.each(['foo.bar', 'foo.js'])('should process file with babel-jest', (filePath) => {
      const fileContent = 'foo'
      const jestCfg = {
        globals: {
          'ts-jest': { babelConfig: true },
        },
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
})
