import { ConfigSet, MATCH_NOTHING, IGNORE_DIAGNOSTIC_CODES } from './config-set'
import * as fakers from '../__helpers__/fakers'
import { TsJestGlobalOptions } from './types'
import * as _backports from './backports'
import { mocked } from '../__helpers__/mocks'
import { ScriptTarget, ModuleKind } from 'typescript'
import { resolve } from 'path'

jest.mock('./backports')
jest.mock('../../package.json', () => ({ version: 'X.Y.Z' }))

const backports = mocked(_backports)

backports.backportJestConfig.mockImplementation(config => ({
  ...config,
  __backported: true,
}))

const defaultResolve = (path: string) => `resolved:${path}`

function createConfigSet({
  jestConfig,
  tsJestConfig,
  parentConfig,
  resolve = defaultResolve,
}: {
  jestConfig?: jest.ProjectConfig
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
  resolve?: ((path: string) => string) | null
} = {}) {
  const cs = new ConfigSet(
    fakers.jestConfig(jestConfig, tsJestConfig),
    parentConfig,
  )
  if (resolve) {
    jest.spyOn(cs, 'resolvePath').mockImplementation(resolve)
  }
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
    expect(
      createConfigSet({ parentConfig: { __parent: true } as any }).jest,
    ).toMatchSnapshot()
  })
})

describe('tsJest', () => {
  const get = (tsJest?: TsJestGlobalOptions) =>
    createConfigSet({ tsJestConfig: tsJest }).tsJest

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
      }
      expect(get().diagnostics).toEqual(EXPECTED)
      expect(get({ diagnostics: true }).diagnostics).toEqual(EXPECTED)
    })

    it('should be correct for false', () => {
      const EXPECTED = {
        ignoreCodes: IGNORE_DIAGNOSTIC_CODES,
        pretty: true,
        pathRegex: MATCH_NOTHING.source,
      }
      expect(get({ diagnostics: false }).diagnostics).toEqual(EXPECTED)
    })

    it('should be correct for inline config', () => {
      const EXPECTED = {
        ignoreCodes: [...IGNORE_DIAGNOSTIC_CODES, 10, 25],
        pretty: false,
        pathRegex: '\\.test\\.ts',
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
  }) // diagnostics

  describe('stringifyContentPathRegex', () => {
    it('should be correct for default value', () => {
      expect(get().stringifyContentPathRegex).toBeUndefined()
      expect(
        get({ stringifyContentPathRegex: null as any })
          .stringifyContentPathRegex,
      ).toBeUndefined()
    })
    it('should be normalized to a string', () => {
      expect(
        get({ stringifyContentPathRegex: /abc/ }).stringifyContentPathRegex,
      ).toBe('abc')
      expect(
        get({ stringifyContentPathRegex: 'abc' }).stringifyContentPathRegex,
      ).toBe('abc')
    })
  }) // stringifyContentPathRegex

  describe('typeCheck', () => {
    it('should be correct for default value', () => {
      expect(get().typeCheck).toBe(false)
      expect(get({ typeCheck: false }).typeCheck).toBe(false)
    })
    it('should be normalized to a boolean', () => {
      expect(get({ typeCheck: 'yes' as any }).typeCheck).toBe(true)
      expect(get({ typeCheck: false }).typeCheck).toBe(false)
    })
  }) // typeCheck

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
  const get = (
    tsJest?: TsJestGlobalOptions,
    parentConfig?: TsJestGlobalOptions,
  ) => createConfigSet({ tsJestConfig: tsJest, parentConfig }).typescript

  it('should read file list from default tsconfig', () => {
    // since the default is to lookup for tsconfig,
    // we should have this file in the list
    expect(get().fileNames).toContain(__filename)
  })

  it('should include compiler config from `tsConfig` option key', () => {
    expect(get({ tsConfig: { baseUrl: 'src/lib' } }).options.baseUrl).toBe(
      __dirname,
    )
  })

  it('should include compiler config from base config', () => {
    expect(
      get(void 0, { tsConfig: { target: 'esnext' as any } }).options.target,
    ).toBe(ScriptTarget.ESNext)
  })

  it('should override some options', () => {
    expect(
      get({ tsConfig: { module: 'esnext' as any, inlineSources: false } })
        .options,
    ).toMatchObject({ module: ModuleKind.CommonJS, inlineSources: true })
  })

  it('should be able to read extends', () => {
    const cs = createConfigSet({
      tsJestConfig: { tsConfig: 'tsconfig.build.json' },
      resolve: null,
    })
    expect(cs.typescript.options).toMatchObject({
      module: ModuleKind.CommonJS,
      rootDir: resolve(__dirname, '..'),
      skipLibCheck: true,
    })
  })
})

describe.skip('rootDir', () => {})
describe.skip('cwd', () => {})
describe.skip('babel', () => {})
describe.skip('compilerModule', () => {})
describe.skip('babelJestTransformer', () => {})
describe.skip('tsCompiler', () => {})
describe.skip('hooks', () => {})
describe.skip('filterDiagnostics', () => {})
describe.skip('shouldReportDiagnostic', () => {})
describe.skip('shouldStringifyContent', () => {})
describe.skip('createTsError', () => {})
describe.skip('tsCacheDir', () => {})
describe.skip('readTsConfig', () => {})
describe.skip('resolvePath', () => {})
describe.skip('jsonValue', () => {})
describe.skip('cacheKey', () => {})
