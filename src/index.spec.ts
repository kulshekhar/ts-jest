// tslint:disable:max-line-length
import { __setup } from './util/debug'
import * as tsJest from '.'
import { TsJestTransformer } from './ts-jest-transformer'

jest.mock('./lib/ts-jest-transformer', () => {
  class TsJestTransformer {
    process: jest.Mock = jest.fn()
    getCacheKey: jest.Mock = jest.fn()
    constructor(public opt?: any) {}
  }
  return { TsJestTransformer }
})
jest.mock('./lib/create-jest-preset', () => ({
  createJestPreset: () => ({ jestPreset: true }),
}))

describe('ts-jest', () => {
  it('should export a `createTransformer` function', () => {
    expect(typeof tsJest.createTransformer).toBe('function')
  })
  it('should export a `process` function', () => {
    expect(typeof tsJest.process).toBe('function')
  })
  it('should export a `getCacheKey` function', () => {
    expect(typeof tsJest.getCacheKey).toBe('function')
  })
  it('should export a `createJestPreset` function', () => {
    expect(typeof tsJest.createJestPreset).toBe('function')
  })
  it('should export a `jestPreset` object', () => {
    expect(tsJest.jestPreset).toEqual({ jestPreset: true })
  })
})

describe('old entry point', () => {
  const MANIFEST = { tsJestIndex: true }
  const spy = jest.spyOn(console, 'warn')
  spy.mockImplementation(() => undefined)
  afterAll(() => {
    spy.mockRestore()
  })

  it('should warn when using old path to ts-jest', () => {
    jest.mock('../dist/index', () => MANIFEST)
    expect(require('../preprocessor.js')).toBe(MANIFEST)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  "ts-jest",
  "[deprecated]",
  "Replace any occurrences of \\"ts-jest/dist/preprocessor.js\\" or  \\"<rootDir>/node_modules/ts-jest/preprocessor.js\\" in the 'transform' section of your Jest config with just \\"ts-jest\\".",
]
`)
  })
})

describe('createTransformer', () => {
  it('should create different instances', () => {
    const tr1 = tsJest.createTransformer()
    const tr2 = tsJest.createTransformer()
    expect(tr1).toBeInstanceOf(TsJestTransformer)
    expect(tr2).toBeInstanceOf(TsJestTransformer)
    expect(tr1).not.toBe(tr2)
  })
  it('should accept base options', () => {
    expect((tsJest.createTransformer({ typeCheck: true }) as any).opt).toEqual({
      typeCheck: true,
    })
  })
})

describe('bare methods', () => {
  beforeEach(() => {
    tsJest.__resetModule()
  })
  it('should use the same instance of transformer for `process`', () => {
    tsJest.process('foo')
    expect(tsJest.__singleton().process).toHaveBeenCalledTimes(1)
    expect(tsJest.__singleton().process).toHaveBeenCalledWith('foo')
    tsJest.process('bar')
    expect(tsJest.__singleton().process).toHaveBeenCalledTimes(2)
    expect(tsJest.__singleton().process).toHaveBeenLastCalledWith('bar')
  })
  it('should use the same instance of transformer for `getCacheKey`', () => {
    tsJest.getCacheKey('foo')
    expect(tsJest.__singleton().getCacheKey).toHaveBeenCalledTimes(1)
    expect(tsJest.__singleton().getCacheKey).toHaveBeenCalledWith('foo')
    tsJest.getCacheKey('bar')
    expect(tsJest.__singleton().getCacheKey).toHaveBeenCalledTimes(2)
    expect(tsJest.__singleton().getCacheKey).toHaveBeenLastCalledWith('bar')
  })
})
