import { Transformer } from '@jest/transform/build/types'
import { Config } from '@jest/types'
import { testing } from 'bs-logger'
import { resolve } from 'path'
import { Diagnostic, DiagnosticCategory, ModuleKind, ParsedCommandLine, ScriptTarget } from 'typescript'
// tslint:disable-next-line:no-duplicate-imports
import * as ts from 'typescript'

import * as _myModule from '..'
import { mocked } from '../../utils'
import * as fakers from '../__helpers__/fakers'
import { logTargetMock } from '../__helpers__/mocks'
import { TsJestGlobalOptions } from '../types'
import * as _backports from '../util/backports'
import { normalizeSlashes } from '../util/normalize-slashes'

import { ConfigSet, IGNORE_DIAGNOSTIC_CODES, MATCH_NOTHING } from './config-set'

jest.mock('../util/backports')
jest.mock('../index')

const backports = mocked(_backports)
const myModule = mocked(_myModule)

backports.backportJestConfig.mockImplementation((_, config) => ({
  ...config,
  __backported: true,
}))

const defaultResolve = (path: string) => `resolved:${path}`
const pkgVersion = (pkgName: string) => require(`${pkgName}/package.json`).version || '????'

function createConfigSet({
  jestConfig,
  tsJestConfig,
  parentConfig,
  resolve = defaultResolve,
  ...others
}: {
  jestConfig?: Config.ProjectConfig
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
  resolve?: ((path: string) => string) | null
  [key: string]: any
} = {}) {
  const cs = new ConfigSet(fakers.jestConfig(jestConfig, tsJestConfig), parentConfig)
  if (resolve) {
    cs.resolvePath = resolve
  }
  Object.keys(others).forEach(key => {
    Object.defineProperty(cs, key, { value: others[key] })
  })
  return cs
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('jest', () => {
  it('should returns correct config and go thru backports', () => {
    expect(createConfigSet().jest).toMatchSnapshot()
    expect(backports.backportJestConfig).toHaveBeenCalledTimes(1)
  })

  it('should merge parent config if any', () => {
    expect(createConfigSet({ parentConfig: { __parent: true } as any }).jest).toMatchSnapshot()
  })
})

describe('tsJest', () => {
  const get = (tsJest?: TsJestGlobalOptions) => createConfigSet({ tsJestConfig: tsJest }).tsJest

  it('should return correct defaults', () => {
    expect(get()).toMatchSnapshot()
  })

  describe('tsconfig', () => {
    it('should be correct for default value', () => {
      const EXPECTED = {
        kind: 'file',
        value: undefined,
      }
      expect(get().tsConfig).toEqual(EXPECTED)
      expect(get({ tsConfig: true }).tsConfig).toEqual(EXPECTED)
    })
    it('should be correct for false', () => {
      expect(get({ tsConfig: false }).tsConfig).toBeUndefined()
    })

    it('should be correct for given file', () => {
      const FILE = 'bar/tsconfig.foo.json'
      const EXPECTED = {
        kind: 'file',
        value: defaultResolve(FILE),
      }
      expect(get({ tsConfig: FILE }).tsConfig).toEqual(EXPECTED)
    })

    it('should be correct for inline config', () => {
      const CONFIG = { foo: 'bar' }
      const EXPECTED = {
        kind: 'inline',
        value: CONFIG,
      }
      expect(get({ tsConfig: CONFIG as any }).tsConfig).toEqual(EXPECTED)
    })
  }) // tsconfig

  describe('packageJson', () => {
    it('should be correct for default value', () => {
      const EXPECTED = {
        kind: 'file',
        value: undefined,
      }
      expect(get().packageJson).toEqual(EXPECTED)
    })

    it('should be correct for given file', () => {
      const FILE = 'bar/tsconfig.foo.json'
      const EXPECTED = {
        kind: 'file',
        value: defaultResolve(FILE),
      }
      expect(get({ packageJson: FILE }).packageJson).toEqual(EXPECTED)
    })

    it('should be correct for inline config', () => {
      const CONFIG = { foo: 'bar' }
      const EXPECTED = {
        kind: 'inline',
        value: CONFIG,
      }
      expect(get({ packageJson: CONFIG as any }).packageJson).toEqual(EXPECTED)
    })
  }) // packageJson

  describe('babelConfig', () => {
    it('should be correct for default value', () => {
      expect(get().babelConfig).toBeUndefined()
      expect(get({ babelConfig: false }).babelConfig).toBeUndefined()
    })

    it('should be correct for true', () => {
      const EXPECTED = {
        kind: 'file',
        value: undefined,
      }
      expect(get({ babelConfig: true }).babelConfig).toEqual(EXPECTED)
    })

    it('should be correct for given non javascript file path', () => {
      const FILE = 'src/__mocks__/.babelrc-foo'
      const cs = createConfigSet({
        tsJestConfig: {
          babelConfig: FILE,
        },
        resolve: null,
      })
      expect(cs.tsJest.babelConfig!.kind).toEqual('file')
      expect(cs.tsJest.babelConfig!.value).toContain('.babelrc-foo')
      expect(cs.babel?.plugins).toEqual([])
      expect(cs.babel?.presets).toEqual([])
    })

    it('should be correct for given javascript file path', () => {
      const FILE = 'src/__mocks__/babel-foo.config.js'
      const cs = createConfigSet({
        tsJestConfig: {
          babelConfig: FILE,
        },
        resolve: null,
      })
      expect(cs.tsJest.babelConfig!.kind).toEqual('file')
      expect(cs.tsJest.babelConfig!.value).toContain('babel-foo.config.js')
      expect(cs.babel?.plugins).toEqual([])
      expect(cs.babel?.presets).toEqual([])
    })

    it('should be correct for imported javascript file', () => {
      const cs = createConfigSet({
        jestConfig: { rootDir: 'src', cwd: 'src' } as any,
        tsJestConfig: {
          babelConfig: require('../__mocks__/babel-foo.config'),
        },
        resolve: null,
      })
      expect(cs.tsJest.babelConfig!.kind).toEqual('inline')
      expect(cs.babel?.plugins).toEqual([])
      expect(cs.babel?.presets).toEqual([])
    })

    it('should be correct for inline config', () => {
      const CONFIG = { foo: 'bar' }
      const EXPECTED = {
        kind: 'inline',
        value: CONFIG,
      }
      expect(get({ babelConfig: CONFIG as any }).babelConfig).toEqual(EXPECTED)
    })
  }) // babelConfig

  describe('diagnostics', () => {
    it('should be correct for default value', () => {
      const EXPECTED = {
        ignoreCodes: IGNORE_DIAGNOSTIC_CODES,
        pretty: true,
        throws: true,
      }
      expect(get().diagnostics).toEqual(EXPECTED)
      expect(get({ diagnostics: true }).diagnostics).toEqual(EXPECTED)
    })

    it('should be correct for false', () => {
      const EXPECTED = {
        ignoreCodes: IGNORE_DIAGNOSTIC_CODES,
        pretty: true,
        pathRegex: MATCH_NOTHING.source,
        throws: false,
      }
      expect(get({ diagnostics: false }).diagnostics).toEqual(EXPECTED)
    })

    it('should be correct for inline config', () => {
      const EXPECTED = {
        ignoreCodes: [...IGNORE_DIAGNOSTIC_CODES, 10, 25],
        pretty: false,
        pathRegex: '\\.test\\.ts',
        throws: true,
      }
      expect(
        get({
          diagnostics: {
            ignoreCodes: '10, 25',
            pathRegex: EXPECTED.pathRegex,
            pretty: false,
          },
        }).diagnostics,
      ).toEqual(EXPECTED)
      expect(
        get({
          diagnostics: {
            ignoreCodes: ['10', 25],
            pretty: false,
            pathRegex: RegExp(EXPECTED.pathRegex),
          },
        }).diagnostics,
      ).toEqual(EXPECTED)
    })
    it('should have correct throws value', () => {
      const EXPECTED = {
        ignoreCodes: IGNORE_DIAGNOSTIC_CODES,
        pretty: true,
      }
      expect(get({ diagnostics: { warnOnly: true } }).diagnostics).toEqual({ ...EXPECTED, throws: false })
      expect(get({ diagnostics: { warnOnly: false } }).diagnostics).toEqual({ ...EXPECTED, throws: true })
    })
  }) // diagnostics

  describe('stringifyContentPathRegex', () => {
    it('should be correct for default value', () => {
      expect(get().stringifyContentPathRegex).toBeUndefined()
      expect(get({ stringifyContentPathRegex: null as any }).stringifyContentPathRegex).toBeUndefined()
    })
    it('should be normalized to a string', () => {
      expect(get({ stringifyContentPathRegex: /abc/ }).stringifyContentPathRegex).toBe('abc')
      expect(get({ stringifyContentPathRegex: 'abc' }).stringifyContentPathRegex).toBe('abc')
    })
  }) // stringifyContentPathRegex

  describe('isolatedModules', () => {
    it('should be correct for default value', () => {
      expect(get().isolatedModules).toBe(false)
      expect(get({ isolatedModules: false }).isolatedModules).toBe(false)
    })
    it('should be normalized to a boolean', () => {
      expect(get({ isolatedModules: 'yes' as any }).isolatedModules).toBe(true)
      expect(get({ isolatedModules: 1 as any }).isolatedModules).toBe(true)
    })
  }) // isolatedModules

  describe('compiler', () => {
    it('should be correct for default value', () => {
      expect(get().compiler).toBe('typescript')
      expect(get({ compiler: 'typescript' }).compiler).toBe('typescript')
    })
    it('should be given non-default value', () => {
      expect(get({ compiler: 'ttypescript' }).compiler).toBe('ttypescript')
    })
  }) // compiler
}) // tsJest

describe('makeDiagnostic', () => {
  const cs = createConfigSet()
  it('should create diagnostic with defaults', () => {
    expect(cs.makeDiagnostic(1234, 'foo is not bar')).toMatchInlineSnapshot(`
Object {
  "category": 0,
  "code": 1234,
  "file": undefined,
  "length": undefined,
  "messageText": "foo is not bar",
  "start": undefined,
}
`)
  })
  it('should set category', () => {
    expect(cs.makeDiagnostic(4321, 'foo might be bar', { category: ts.DiagnosticCategory.Error }))
      .toMatchInlineSnapshot(`
Object {
  "category": 1,
  "code": 4321,
  "file": undefined,
  "length": undefined,
  "messageText": "foo might be bar",
  "start": undefined,
}
`)
  })
}) // makeDiagnostic

describe('typescript', () => {
  const get = (tsJest?: TsJestGlobalOptions, parentConfig?: TsJestGlobalOptions) =>
    createConfigSet({ tsJestConfig: tsJest, parentConfig }).typescript

  it('should read file list from default tsconfig', () => {
    // since the default is to lookup for tsconfig,
    // we should have this file in the list
    expect(get().fileNames).toContain(normalizeSlashes(__filename))
  })

  it('should include compiler config from `tsConfig` option key', () => {
    expect(get({ tsConfig: { baseUrl: 'src/config' } }).options.baseUrl).toBe(normalizeSlashes(__dirname))
  })

  it('should include compiler config from base config', () => {
    expect(get(void 0, { tsConfig: { target: 'esnext' as any } }).options.target).toBe(ScriptTarget.ESNext)
  })

  it('should override some options', () => {
    expect(get({ tsConfig: { module: 'esnext' as any, inlineSources: false } }).options).toMatchObject({
      module: ModuleKind.CommonJS,
      inlineSources: true,
    })
  })

  it('should be able to read extends', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsConfig: 'tsconfig.build.json' },
      resolve: null,
    })
    expect(cs.typescript.options).toMatchObject({
      module: ModuleKind.CommonJS,
      rootDir: normalizeSlashes(resolve(__dirname, '..')),
      skipLibCheck: true,
    })
  })

  it('should warn about possibly wrong module config and set synth. default imports', () => {
    const target = logTargetMock()
    target.clear()
    const cs = createConfigSet({
      tsJestConfig: {
        tsConfig: { module: 'ES6', esModuleInterop: false } as any,
        diagnostics: { warnOnly: true, pretty: false },
      },
      resolve: null,
    })
    expect(cs.typescript.options).toMatchObject({
      module: ModuleKind.CommonJS,
      allowSyntheticDefaultImports: true,
      esModuleInterop: false,
    })
    expect(target.lines.warn.join()).toMatchInlineSnapshot(`
"[level:40] TypeScript diagnostics (customize using \`[jest-config].globals.ts-jest.diagnostics\` option):
message TS151001: If you have issues related to imports, you should consider setting \`esModuleInterop\` to \`true\` in your TypeScript configuration file (usually \`tsconfig.json\`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.
"
`)
  })

  it('should not warn neither set synth. default imports if using babel', () => {
    const target = logTargetMock()
    target.clear()
    const cs = createConfigSet({
      tsJestConfig: {
        tsConfig: { module: 'amd', esModuleInterop: false } as any,
        diagnostics: { warnOnly: true, pretty: false },
        babelConfig: { babelrc: false },
      },
      resolve: null,
    })
    expect(cs.typescript.options).toMatchObject({
      module: ModuleKind.AMD,
      esModuleInterop: false,
    })
    expect(cs.typescript.options.allowSyntheticDefaultImports).toBeFalsy()
    expect(target.lines.warn).toHaveLength(0)
  })
}) // typescript

describe('resolvePath', () => {
  it('should resolve paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false })
    expect(doResolve('bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/./bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should resolve node paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path, { throwIfMissing: false, nodeResolve: true })
    expect(doResolve('json5')).toBe(resolve(__dirname, '../../node_modules/json5', require('json5/package.json').main))
    expect(doResolve('./bar.js')).toBe(resolve('/cwd/bar.js'))
    expect(doResolve('<rootDir>bar.js')).toBe(resolve('/root/bar.js'))
    expect(doResolve('<rootDir>/bar.js')).toBe(resolve('/root//bar.js'))
  })
  it('should throw for invalid paths', () => {
    const cs = createConfigSet({ jestConfig: { rootDir: __dirname, cwd: __dirname } as any, resolve: null })
    const doResolve = (path: string) => cs.resolvePath(path)
    expect(() => doResolve('bar.js')).toThrow()
    expect(() => doResolve('./bar.js')).toThrow()
    expect(() => doResolve('<rootDir>bar.js')).toThrow()
    expect(() => doResolve('<rootDir>/bar.js')).toThrow()
  })
}) // resolvePath

describe('readTsConfig', () => {
  let findConfig!: jest.SpyInstance<string | undefined>
  let readConfig!: jest.SpyInstance<{ config?: any; error?: Diagnostic }>
  let parseConfig!: jest.SpyInstance<ParsedCommandLine>
  let cs!: ConfigSet
  beforeAll(() => {
    findConfig = jest.spyOn(ts, 'findConfigFile')
    readConfig = jest.spyOn(ts, 'readConfigFile')
    parseConfig = jest.spyOn(ts, 'parseJsonConfigFileContent')
    cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any })
    findConfig.mockImplementation(p => `${p}/tsconfig.json`)
    readConfig.mockImplementation(p => ({ config: { path: p, compilerOptions: {} } }))
    parseConfig.mockImplementation((conf: any) => ({ options: conf, fileNames: [], errors: [] }))
  })
  beforeEach(() => {
    findConfig.mockClear()
    readConfig.mockClear()
    parseConfig.mockClear()
  })
  afterAll(() => {
    findConfig.mockRestore()
    readConfig.mockRestore()
    parseConfig.mockRestore()
  })
  it('should use correct paths when searching', () => {
    const conf = cs.readTsConfig()
    expect(conf.input.path).toBe('/root/tsconfig.json')
    expect(findConfig.mock.calls[0][0]).toBe('/root')
    expect(readConfig.mock.calls[0][0]).toBe('/root/tsconfig.json')
    expect(parseConfig.mock.calls[0][2]).toBe('/root')
    expect(parseConfig.mock.calls[0][4]).toBe('/root/tsconfig.json')
  })
  it('should use given tsconfig path', () => {
    const conf = cs.readTsConfig(undefined, '/foo/tsconfig.bar.json')
    expect(conf.input.path).toBe('/foo/tsconfig.bar.json')
    expect(findConfig).not.toBeCalled()
    expect(readConfig.mock.calls[0][0]).toBe('/foo/tsconfig.bar.json')
    expect(parseConfig.mock.calls[0][2]).toBe('/foo')
    expect(parseConfig.mock.calls[0][4]).toBe('/foo/tsconfig.bar.json')
  })
}) // readTsConfig

describe('versions', () => {
  describe('without babel', () => {
    it('should return correct version map', () => {
      expect(createConfigSet().versions).toEqual({
        jest: pkgVersion('jest'),
        'ts-jest': myModule.version,
        typescript: pkgVersion('typescript'),
      })
    })
  })
  describe('with babel', () => {
    it('should return correct version map', () => {
      expect(createConfigSet({ tsJestConfig: { babelConfig: {} } }).versions).toEqual({
        '@babel/core': pkgVersion('@babel/core'),
        'babel-jest': pkgVersion('babel-jest'),
        jest: pkgVersion('jest'),
        'ts-jest': myModule.version,
        typescript: pkgVersion('typescript'),
      })
    })
  })
}) // versions

describe('tsJestDigest', () => {
  it('should be the package digest', () => {
    expect(createConfigSet().tsJestDigest).toBe(myModule.digest)
  })
}) // tsJestDigest

describe('tsconfig', () => {
  it('should return input tsconfig', () => {
    const cs = createConfigSet({ tsJestConfig: { tsConfig: { target: 'ES6' } } as any })
    expect(cs.tsconfig.compilerOptions.target).toBe('ES6')
  })
}) // tsconfig

describe('shouldStringifyContent', () => {
  it('should return correct value', () => {
    const cs = createConfigSet({ tsJestConfig: { tsConfig: false, stringifyContentPathRegex: '\\.str$' } as any })
    expect(cs.shouldStringifyContent('/foo/bar.ts')).toBe(false)
    expect(cs.shouldStringifyContent('/foo/bar.str')).toBe(true)
  })
}) // shouldStringifyContent

describe('shouldReportDiagnostic', () => {
  it('should return correct value', () => {
    let cs = createConfigSet({ tsJestConfig: { tsConfig: false, diagnostics: { pathRegex: '/foo/' } } as any })
    expect(cs.shouldReportDiagnostic('/foo/index.ts')).toBe(true)
    expect(cs.shouldReportDiagnostic('/bar/index.ts')).toBe(false)
    cs = createConfigSet({ tsJestConfig: { tsConfig: false } as any })
    expect(cs.shouldReportDiagnostic('/foo/index.ts')).toBe(true)
    expect(cs.shouldReportDiagnostic('/bar/index.ts')).toBe(true)
  })
}) // shouldReportDiagnostic

describe('tsCompiler', () => {
  it('should be a compiler object', () => {
    const cs = createConfigSet({ tsJestConfig: { tsConfig: false } as any })
    const compiler = cs.tsCompiler
    expect(compiler.cwd).toBe(cs.cwd)
    expect(compiler.cachedir).toBe(cs.tsCacheDir)
    expect(compiler.extensions).toMatchInlineSnapshot(`
Array [
  ".ts",
  ".tsx",
]
`)
    expect(compiler.ts).toBe(cs.compilerModule)
    expect(typeof compiler.compile).toBe('function')
    expect(typeof compiler.getTypeInfo).toBe('function')
  })
}) // tsCompiler

describe('babelJestTransformer', () => {
  it('should return a babel-jest transformer', () => {
    let cs = createConfigSet({ tsJestConfig: { tsConfig: false } as any })
    expect(cs.babelJestTransformer).toBeUndefined()
    cs = createConfigSet({ tsJestConfig: { tsConfig: false, babelConfig: {} } as any })
    const babelJest = cs.babelJestTransformer as Transformer
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })
}) // babelJestTransformer

describe('projectDependencies', () => {
  const pkg = {
    optionalDependencies: { opt: '1.2.3' },
    peerDependencies: { peer: '1.2.4' },
    devDependencies: { dev: '1.2.5' },
    dependencies: { std: '1.2.6' },
  }
  const realVersions: any = {
    peer: '0.1.0',
    dev: '4.3.2',
    std: '9.10.2',
  }
  it('should list all deps with their real version', () => {
    jest.doMock('peer/package.json', () => ({ version: realVersions.peer }), { virtual: true })
    jest.doMock('dev/package.json', () => ({ version: realVersions.dev }), { virtual: true })
    jest.doMock('std/package.json', () => ({ version: realVersions.std }), { virtual: true })
    const cs = createConfigSet({
      tsJestConfig: { tsConfig: false } as any,
      projectPackageJson: pkg,
    })
    expect(cs.projectDependencies).toEqual(realVersions)
    jest.dontMock('peer/package.json')
    jest.dontMock('dev/package.json')
    jest.dontMock('std/package.json')
  })
}) // projectDependencies

describe('cacheKey', () => {
  it('should be a string', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsConfig: false } as any,
      projectDependencies: {
        opt: '1.2.3',
        peer: '1.2.4',
        dev: '1.2.5',
        std: '1.2.6',
      },
    })
    // we tested those and don't want the snapshot to change all the time we upgrade
    const val = cs.jsonValue.value
    delete val.versions
    cs.jsonValue.value = val
    // digest is mocked in src/__mocks__/index.ts
    expect(cs.cacheKey).toMatchInlineSnapshot(
      '"{\\"digest\\":\\"a0d51ca854194df8191d0e65c0ca4730f510f332\\",\\"jest\\":{\\"__backported\\":true,\\"globals\\":{}},\\"projectDepVersions\\":{\\"dev\\":\\"1.2.5\\",\\"opt\\":\\"1.2.3\\",\\"peer\\":\\"1.2.4\\",\\"std\\":\\"1.2.6\\"},\\"transformers\\":[\\"hoisting-jest-mock@1\\"],\\"tsJest\\":{\\"compiler\\":\\"typescript\\",\\"diagnostics\\":{\\"ignoreCodes\\":[6059,18002,18003],\\"pretty\\":true,\\"throws\\":true},\\"isolatedModules\\":false,\\"packageJson\\":{\\"kind\\":\\"file\\"},\\"transformers\\":[]},\\"tsconfig\\":{\\"declaration\\":false,\\"inlineSourceMap\\":false,\\"inlineSources\\":true,\\"module\\":1,\\"noEmit\\":false,\\"outDir\\":\\"$$ts-jest$$\\",\\"removeComments\\":false,\\"sourceMap\\":true,\\"target\\":1}}"',
    )
  })
}) // cacheKey

describe('jsonValue', () => {
  it('should create jsonValue based on each config and version', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsConfig: false } as any,
      projectDependencies: {
        'some-module': '1.2.3',
      },
    })
    const val = cs.jsonValue.valueOf()
    expect(cs.toJSON()).toEqual(val)
    // it will change each time we upgrade – we tested those in the `version` block
    expect(val.versions).toEqual(cs.versions)
    delete val.versions

    // digest is mocked in src/__mocks__/index.ts
    expect(val).toMatchInlineSnapshot(`
Object {
  "babel": undefined,
  "digest": "a0d51ca854194df8191d0e65c0ca4730f510f332",
  "jest": Object {
    "__backported": true,
    "globals": Object {},
  },
  "projectDepVersions": Object {
    "some-module": "1.2.3",
  },
  "transformers": Array [
    "hoisting-jest-mock@1",
  ],
  "tsJest": Object {
    "babelConfig": undefined,
    "compiler": "typescript",
    "diagnostics": Object {
      "ignoreCodes": Array [
        6059,
        18002,
        18003,
      ],
      "pretty": true,
      "throws": true,
    },
    "isolatedModules": false,
    "packageJson": Object {
      "kind": "file",
      "value": undefined,
    },
    "stringifyContentPathRegex": undefined,
    "transformers": Array [],
    "tsConfig": undefined,
  },
  "tsconfig": Object {
    "configFilePath": undefined,
    "declaration": false,
    "inlineSourceMap": false,
    "inlineSources": true,
    "module": 1,
    "noEmit": false,
    "outDir": "$$ts-jest$$",
    "removeComments": false,
    "sourceMap": true,
    "target": 1,
  },
}
`)
  })
}) // jsonValue

describe('raiseDiagnostics', () => {
  const createTsError = jest.fn(
    (list: Diagnostic[]) => new Error(list.map(d => `[TS${d.code}] ${d.messageText}`).join('\n')),
  )
  const filterDiagnostics = jest.fn(list => list)
  const logger = testing.createLoggerMock()
  const makeDiagnostic = ({
    messageText = 'foo',
    code = 9999,
    category = DiagnosticCategory.Warning,
  }: Partial<Diagnostic> = {}): Diagnostic => ({ messageText, code, category } as any)
  it('should throw when warnOnly is false', () => {
    const { raiseDiagnostics } = createConfigSet({ createTsError, filterDiagnostics })
    expect(() => raiseDiagnostics([])).not.toThrow()
    expect(() => raiseDiagnostics([makeDiagnostic()])).toThrowErrorMatchingInlineSnapshot(`"[TS9999] foo"`)
    expect(() => raiseDiagnostics([makeDiagnostic({ category: DiagnosticCategory.Message })])).not.toThrow()
  })
  it('should not throw when warnOnly is true', () => {
    const { raiseDiagnostics } = createConfigSet({
      createTsError,
      filterDiagnostics,
      logger,
      tsJestConfig: { diagnostics: { warnOnly: true } },
    })
    logger.target.clear()
    expect(() => raiseDiagnostics([])).not.toThrow()
    expect(() => raiseDiagnostics([makeDiagnostic()])).not.toThrow()
    expect(logger.target.lines).toMatchInlineSnapshot(`
Array [
  "[level:40] [TS9999] foo
",
]
`)
  })
}) // raiseDiagnostics
