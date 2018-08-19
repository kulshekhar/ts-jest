import * as tsJest from '.'
import { TsJestTransformer } from './lib/ts-jest-transformer'

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
