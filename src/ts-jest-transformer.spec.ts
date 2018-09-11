import stringify from 'fast-json-stable-stringify'

import { TsJestTransformer } from './ts-jest-transformer'

describe('configFor', () => {
  it('should return the same config-set for same values', () => {
    const obj1 = { cwd: '/foo', rootDir: '/bar', globals: {} }
    const obj2 = { ...obj1 }
    const str = stringify(obj1)
    const cs1 = new TsJestTransformer().configsFor(obj1 as any)
    const cs2 = new TsJestTransformer().configsFor(obj2 as any)
    const cs3 = new TsJestTransformer().configsFor(str)
    expect(cs1.cwd).toBe('/foo')
    expect(cs1.rootDir).toBe('/bar')
    expect(cs2).toBe(cs1)
    expect(cs3).toBe(cs1)
  })
})

describe('lastTransformerId', () => {
  it('should increment for each instance', () => {
    const start = TsJestTransformer.lastTransformerId
    const id1 = new TsJestTransformer()
    const id2 = new TsJestTransformer()
    expect(id1).not.toBe(start)
    expect(id2).not.toBe(start)
    expect(id2).not.toBe(id1)
  })
})

describe('process', () => {
  let tr: TsJestTransformer
  let babel: any
  const config = {
    shouldStringifyContent: jest.fn(),
    get babelJestTransformer() {
      return babel
    },
    tsCompiler: { compile: jest.fn() },
    hooks: {},
  }
  const INPUT = 'export default "foo"'
  const FILE = '/foo/bar.ts'
  const JEST_CONFIG = {} as jest.ProjectConfig
  const process = () => tr.process(INPUT, FILE, JEST_CONFIG)
  beforeEach(() => {
    tr = new TsJestTransformer()
    jest
      .spyOn(tr, 'configsFor')
      .mockImplementation(() => config)
      .mockClear()
    config.shouldStringifyContent.mockImplementation(() => false).mockClear()
    babel = { process: jest.fn(s => `babel:${s}`) }
    config.tsCompiler.compile.mockImplementation(s => `ts:${s}`).mockClear()
  })

  it('should process input without babel', () => {
    babel = null
    expect(process()).toBe(`ts:${INPUT}`)
    expect(config.shouldStringifyContent.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "/foo/bar.ts",
  ],
]
`)
    expect(config.tsCompiler.compile.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "export default \\"foo\\"",
    "/foo/bar.ts",
  ],
]
`)
  })

  it('should process input with babel', () => {
    expect(process()).toBe(`babel:ts:${INPUT}`)
    expect(config.shouldStringifyContent.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "/foo/bar.ts",
  ],
]
`)
    expect(config.babelJestTransformer.process.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "ts:export default \\"foo\\"",
    "/foo/bar.ts",
    Object {},
    undefined,
  ],
]
`)
    expect(config.tsCompiler.compile.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "export default \\"foo\\"",
    "/foo/bar.ts",
  ],
]
`)
  })
})

describe('getCacheKey', () => {
  it('should be different for each argument value', () => {
    const tr = new TsJestTransformer()
    jest.spyOn(tr, 'configsFor').mockImplementation(jestConfigStr => ({ cacheKey: jestConfigStr }))
    const input = {
      fileContent: 'export default "foo"',
      fileName: 'foo.ts',
      jestConfigStr: '{"foo": "bar"}',
    }
    const key1 = tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr)
    const key2 = tr.getCacheKey(input.fileContent, 'bar.ts', input.jestConfigStr)
    const key3 = tr.getCacheKey(input.fileContent, input.fileName, '{}')
    expect(key2).not.toBe(key1)
    expect(key3).not.toBe(key1)
    expect(key3).not.toBe(key2)
  })
})
