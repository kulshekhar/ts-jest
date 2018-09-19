import { testing } from 'bs-logger'
import { resolve } from 'path'
import ts, { Diagnostic, ModuleKind, ScriptTarget } from 'typescript'

import * as fakers from '../__helpers__/fakers'
import { mocked } from '../__helpers__/mocks'
import { TsJestGlobalOptions } from '../types'
import * as _backports from '../util/backports'
import { normalizeSlashes } from '../util/normalize-slashes'

import { ConfigSet, IGNORE_DIAGNOSTIC_CODES, MATCH_NOTHING } from './config-set'

jest.mock('../util/backports')

const backports = mocked(_backports)

backports.backportJestConfig.mockImplementation((_, config) => ({
  ...config,
  __backported: true,
}))

const defaultResolve = (path: string) => `resolved:${path}`

function createConfigSet({
  jestConfig,
  tsJestConfig,
  parentConfig,
  resolve = defaultResolve,
  ...others
}: {
  jestConfig?: jest.ProjectConfig
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

    it('should be correct for given file', () => {
      const FILE = 'bar/.babelrc-foo'
      const EXPECTED = {
        kind: 'file',
        value: defaultResolve(FILE),
      }
      expect(get({ babelConfig: FILE }).babelConfig).toEqual(EXPECTED)
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
}) // resolvePath

describe('readTsConfig', () => {
  let findConfig!: jest.SpyInstance<typeof ts.findConfigFile>
  let readConfig!: jest.SpyInstance<typeof ts.readConfigFile>
  let parseConfig!: jest.SpyInstance<typeof ts.parseJsonSourceFileConfigFileContent>
  let cs!: ConfigSet
  beforeAll(() => {
    findConfig = jest.spyOn(ts, 'findConfigFile')
    readConfig = jest.spyOn(ts, 'readConfigFile')
    parseConfig = jest.spyOn(ts, 'parseJsonConfigFileContent')
    cs = createConfigSet({ jestConfig: { rootDir: '/root', cwd: '/cwd' } as any })
    findConfig.mockImplementation(p => `${p}/tsconfig.json`)
    readConfig.mockImplementation(p => ({ config: { path: p, compilerOptions: {} } }))
    parseConfig.mockImplementation((conf: any) => ({ options: conf }))
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
      expect(createConfigSet().versions).toMatchInlineSnapshot(`
Object {
  "jest": "23.6.0",
  "ts-jest": "23.10.0-beta.6",
  "tslib": "1.9.3",
  "typescript": "3.0.3",
}
`)
    })
  })
  describe('with babel', () => {
    it('should return correct version map', () => {
      expect(createConfigSet({ tsJestConfig: { babelConfig: {} } }).versions).toMatchInlineSnapshot(`
Object {
  "@babel/core": "-",
  "babel-core": "6.26.3",
  "babel-jest": "23.6.0",
  "jest": "23.6.0",
  "ts-jest": "23.10.0-beta.6",
  "tslib": "1.9.3",
  "typescript": "3.0.3",
}
`)
    })
  })
}) // versions

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
  it('should a compiler object', () => {
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
    const babelJest = cs.babelJestTransformer as jest.Transformer
    expect(babelJest.canInstrument).toBe(true)
    expect(babelJest.createTransformer).toBeUndefined()
    expect(typeof babelJest.getCacheKey).toBe('function')
    expect(typeof babelJest.process).toBe('function')
  })
}) // babelJestTransformer

describe('cacheKey', () => {
  it('should be a string', () => {
    const cs = createConfigSet({ tsJestConfig: { tsConfig: false } as any })
    // we tested those and don't want the snapshot to change all the time we upgrade
    const val = cs.jsonValue.value
    delete val.versions
    cs.jsonValue.value = val
    expect(cs.cacheKey).toMatchInlineSnapshot(
      `"{\\"jest\\":{\\"__backported\\":true,\\"globals\\":{}},\\"transformers\\":[\\"hoisting-jest-mock@1\\"],\\"tsJest\\":{\\"compiler\\":\\"typescript\\",\\"diagnostics\\":{\\"ignoreCodes\\":[6059,18002,18003],\\"pretty\\":true,\\"throws\\":true},\\"isolatedModules\\":false,\\"transformers\\":[]},\\"tsconfig\\":{\\"compilerOptions\\":{}}}"`,
    )
  })
}) // cacheKey

describe('jsonValue', () => {
  it('should create jsonValue based on each config and version', () => {
    const cs = createConfigSet({ tsJestConfig: { tsConfig: false } as any })
    const val = cs.jsonValue.valueOf()
    expect(cs.toJSON()).toEqual(val)
    // it will change each time we upgrade and we tested those in the `version` block
    expect(val.versions).toEqual(cs.versions)
    delete val.versions

    expect(val).toMatchInlineSnapshot(`
Object {
  "babel": undefined,
  "jest": Object {
    "__backported": true,
    "globals": Object {},
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
    "stringifyContentPathRegex": undefined,
    "transformers": Array [],
    "tsConfig": undefined,
  },
  "tsconfig": Object {
    "compilerOptions": Object {},
  },
}
`)
  })
}) // jsonValue

describe('raiseDiagnostics', () => {
  const createTsError = jest.fn(
    (list: Diagnostic[]) => new Error(list.map(d => `[${d.code}] ${d.messageText}`).join('\n')),
  )
  const filterDiagnostics = jest.fn(list => list)
  const logger = testing.createLoggerMock()
  const diagnostic: Diagnostic = { messageText: 'foo', code: 'TS9999' } as any
  it('should throw when warnOnly is false', () => {
    const { raiseDiagnostics } = createConfigSet({ createTsError, filterDiagnostics })
    expect(() => raiseDiagnostics([])).not.toThrow()
    expect(() => raiseDiagnostics([diagnostic])).toThrowErrorMatchingInlineSnapshot(`"[TS9999] foo"`)
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
    expect(() => raiseDiagnostics([diagnostic])).not.toThrow()
    expect(logger.target.lines).toMatchInlineSnapshot(`
Array [
  "[level:40] [TS9999] foo
",
]
`)
  })
}) // raiseDiagnostics
