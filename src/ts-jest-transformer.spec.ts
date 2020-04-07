import { Config } from '@jest/types'
import { sep } from 'path'
import { ParsedCommandLine } from 'typescript'

import { logTargetMock } from './__helpers__/mocks'
import { ConfigSet } from './config/config-set'
import { TsJestTransformer } from './ts-jest-transformer'

describe('configFor', () => {
  it('should return the same config-set for same values with jest config string is not in configSetsIndex', () => {
    const obj1 = { cwd: '/foo/.', rootDir: '/bar//dummy/..', globals: {} }
    const cs3 = new TsJestTransformer().configsFor(obj1 as any)
    expect(cs3.cwd).toBe(`${sep}foo`)
    expect(cs3.rootDir).toBe(`${sep}bar`)
  })

  it('should return the same config-set for same values with jest config string in configSetsIndex', () => {
    const obj1 = { cwd: '/foo/.', rootDir: '/bar//dummy/..', globals: {} }
    const obj2 = { ...obj1 }
    const cs1 = new TsJestTransformer().configsFor(obj1 as any)
    const cs2 = new TsJestTransformer().configsFor(obj2 as any)
    expect(cs1.cwd).toBe(`${sep}foo`)
    expect(cs1.rootDir).toBe(`${sep}bar`)
    expect(cs2).toBe(cs1)
  })
})

describe('process', () => {
  let tr: TsJestTransformer
  let babel: any
  let typescript: ParsedCommandLine
  let args: [string, string, any, any]
  const config = {
    get typescript() {
      return typescript
    },
    shouldStringifyContent: jest.fn(),
    get babelJestTransformer() {
      return babel
    },
    tsCompiler: { compile: jest.fn() },
    hooks: {},
  }
  const INPUT = 'export default "foo"'
  const FILE = '/foo/bar.ts'
  const JEST_CONFIG = {} as Config.ProjectConfig
  const OPTIONS = { instrument: false }
  const process = () => tr.process(...args)
  beforeEach(() => {
    tr = new TsJestTransformer()
    args = [INPUT, FILE, JEST_CONFIG, OPTIONS]
    jest
      .spyOn(tr, 'configsFor')
      .mockImplementation(() => (config as unknown) as ConfigSet)
      .mockClear()
    config.shouldStringifyContent.mockImplementation(() => false).mockClear()
    babel = null
    config.tsCompiler.compile.mockImplementation(s => `ts:${s}`).mockClear()
    typescript = { options: {} } as any
  })

  it('should process ts input without babel', () => {
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

  it('should process js input without babel', () => {
    typescript.options.allowJs = true
    args[1] = '/foo/bar.js'
    expect(process()).toBe(`ts:${INPUT}`)
    expect(config.shouldStringifyContent.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "/foo/bar.js",
  ],
]
`)
    expect(config.tsCompiler.compile.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "export default \\"foo\\"",
    "/foo/bar.js",
  ],
]
`)
  })

  it('should process ts input with babel', () => {
    babel = { process: jest.fn(s => `babel:${s}`) }
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

  it('should process js input with babel', () => {
    typescript.options.allowJs = true
    babel = { process: jest.fn(s => `babel:${s}`) }
    args[1] = '/foo/bar.js'
    expect(process()).toBe(`babel:ts:${INPUT}`)
    expect(config.shouldStringifyContent.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "/foo/bar.js",
  ],
]
`)
    expect(config.babelJestTransformer.process.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "ts:export default \\"foo\\"",
    "/foo/bar.js",
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
    "/foo/bar.js",
  ],
]
`)
  })

  it('should return stringified version of file', () => {
    config.shouldStringifyContent.mockImplementation(() => true)
    expect(process()).toMatchInlineSnapshot(`"module.exports=\\"export default \\\\\\"foo\\\\\\"\\""`)
  })

  it('should warn when trying to process js but allowJs is false', () => {
    args[1] = '/foo/bar.js'
    typescript.options.allowJs = false
    const logs = logTargetMock()
    logs.clear()
    expect(process()).toBe(INPUT)
    expect(logs.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] Got a \`.js\` file to compile while \`allowJs\` option is not set to \`true\` (file: /foo/bar.js). To fix this:
  - if you want TypeScript to process JS files, set \`allowJs\` to \`true\` in your TypeScript config (usually tsconfig.json)
  - if you do not want TypeScript to process your \`.js\` files, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match \`.js\` files anymore
",
]
`)
  })

  it('should return empty string when trying to process definition file types', () => {
    args[1] = '/foo/bar.d.ts'
    expect(process()).toBe('')
  })

  it('should warn when trying to process unknown file types', () => {
    args[1] = '/foo/bar.jest'
    const logs = logTargetMock()
    logs.clear()
    expect(process()).toBe(INPUT)
    expect(logs.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] Got a unknown file type to compile (file: /foo/bar.jest). To fix this, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match this kind of files anymore.
",
]
`)
    logs.clear()
    babel = { process: jest.fn(s => `babel:${s}`) }
    expect(process()).toBe(`babel:${INPUT}`)
    expect(logs.lines.warn).toMatchInlineSnapshot(`
Array [
  "[level:40] Got a unknown file type to compile (file: /foo/bar.jest). To fix this, in your Jest config change the \`transform\` key which value is \`ts-jest\` so that it does not match this kind of files anymore. If you still want Babel to process it, add another entry to the \`transform\` option with value \`babel-jest\` which key matches this type of files.
",
]
`)
  })

  it('should not pass the instrument option to babel-jest', () => {
    babel = { process: jest.fn(s => `babel:${s}`) }
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
    jest
      .spyOn(tr, 'configsFor')
      .mockImplementation(jestConfigStr => (({ cacheKey: JSON.stringify(jestConfigStr) } as unknown) as ConfigSet))
    const input = {
      fileContent: 'export default "foo"',
      fileName: 'foo.ts',
      jestConfigStr: '{"foo": "bar"}',
      options: { config: { foo: 'bar' } as any, instrument: false, rootDir: '/foo' },
    }
    const keys = [
      tr.getCacheKey(input.fileContent, input.fileName, input.jestConfigStr, input.options),
      tr.getCacheKey(input.fileContent, 'bar.ts', input.jestConfigStr, input.options),
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
