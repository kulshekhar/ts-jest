import type { testing } from 'bs-logger'

import * as tsJest from '.'
import { logTargetMock } from './__helpers__/mocks'
import { TsJestTransformer } from './ts-jest-transformer'

jest.mock('./ts-jest-transformer', () => {
  class TsJestTransformer {
    process: jest.Mock = jest.fn()
    getCacheKey: jest.Mock = jest.fn()
    constructor(public opt?: any) {}
  }

  return { TsJestTransformer }
})
jest.mock('./presets/create-jest-preset', () => ({
  createJestPreset: () => ({ jestPreset: true }),
}))

describe('ts-jest', () => {
  it('should export a `createTransformer` function', () => {
    expect(typeof tsJest.createTransformer).toBe('function')
  })

  it('should export a `createJestPreset` function', () => {
    expect(typeof tsJest.createJestPreset).toBe('function')
  })

  it('should export a `mocked` function', () => {
    expect(typeof tsJest.mocked).toBe('function')
  })

  it('should export a `pathsToModuleNameMapper` function', () => {
    expect(typeof tsJest.pathsToModuleNameMapper).toBe('function')
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
  "ts-jest[main] (WARN) Replace any occurrences of \\"ts-jest/dist/preprocessor.js\\" or  \\"<rootDir>/node_modules/ts-jest/preprocessor.js\\" in the 'transform' section of your Jest config with just \\"ts-jest\\".",
]
`)
  })
})

describe('moved helpers', () => {
  let target: testing.LogTargetMock
  beforeEach(() => {
    target = logTargetMock()
    target.clear()
  })

  it('should warn when using mocked', () => {
    tsJest.mocked(42)
    expect(target.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] The \`mocked\` helper has been moved to \`ts-jest/utils\`. Use \`import { mocked } from 'ts-jest/utils'\` instead.
",
]
`)
  })

  it('should warn when using createJestPreset', () => {
    tsJest.createJestPreset()
    expect(target.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] The \`createJestPreset\` helper has been moved to \`ts-jest/utils\`. Use \`import { createJestPreset } from 'ts-jest/utils'\` instead.
",
]
`)
  })

  it('should warn when using pathsToModuleNameMapper', () => {
    tsJest.pathsToModuleNameMapper({})
    expect(target.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] The \`pathsToModuleNameMapper\` helper has been moved to \`ts-jest/utils\`. Use \`import { pathsToModuleNameMapper } from 'ts-jest/utils'\` instead.
",
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
    expect((tsJest.createTransformer({ isolatedModules: true }) as any).opt).toEqual({
      isolatedModules: true,
    })
  })
})
