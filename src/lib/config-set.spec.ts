import { ConfigSet } from './config-set'
import * as fakers from '../__helpers__/fakers'
import { TsJestGlobalOptions } from './types'
import * as _backports from './backports'
import { mocked } from '../__helpers__/mocks'

jest.mock('./backports')

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
  resolve?: (path: string) => string
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
}) // tsJest
