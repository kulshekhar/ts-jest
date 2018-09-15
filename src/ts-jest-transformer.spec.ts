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
  let args: [string, string, any, any]
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
  const OPTIONS = { instrument: false }
  const process = () => tr.process(...args)
  beforeEach(() => {
    tr = new TsJestTransformer()
    args = [INPUT, FILE, JEST_CONFIG, OPTIONS]
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
    Object {
      "instrument": false,
    },
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

  it('should return stringified version of file', () => {
    config.shouldStringifyContent.mockImplementation(() => true)
    expect(process()).toMatchInlineSnapshot(`"ts:module.exports=\\"export default \\\\\\"foo\\\\\\"\\""`)
  })

  it('should not pass the instrument option to babel-jest', () => {
    args[3] = { instrument: true }
    expect(process()).toBe(`babel:ts:${INPUT}`)
    expect(config.babelJestTransformer.process.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "ts:export default \\"foo\\"",
    "/foo/bar.ts",
    Object {},
    Object {
      "instrument": false,
    },
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
      options: { instrument: false, rootDir: '/foo' },
    }
    const keys = [
      tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options),
      tr.getCacheKey(input.fileContent, 'bar.ts', input.jestConfigStr, input.options),
      tr.getCacheKey(input.fileContent, input.fileName, '{}', input.options),
      tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, instrument: true }),
      tr.getCacheKey(input.fileContent, input.fileName, '{}', { ...input.options, rootDir: '/bar' }),
    ]
    // each key should have correct length
    for (const key of keys) {
      expect(key).toHaveLength(40)
    }
    // unique array should have same length
    expect(keys.filter((k, i, all) => all.indexOf(k) === i)).toHaveLength(keys.length)
  })
})
