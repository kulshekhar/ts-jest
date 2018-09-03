import { resolve } from 'path'
import { ModuleKind, ScriptTarget } from 'typescript'

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
}: {
  jestConfig?: jest.ProjectConfig
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
  resolve?: ((path: string) => string) | null
} = {}) {
  const cs = new ConfigSet(fakers.jestConfig(jestConfig, tsJestConfig), parentConfig)
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
})
