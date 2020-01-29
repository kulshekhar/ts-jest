// tslint:disable:max-line-length
import { Config } from '@jest/types'
import { LogLevels } from 'bs-logger'
import { removeSync, writeFileSync } from 'fs-extra'

import * as fakers from './__helpers__/fakers'
import { logTargetMock } from './__helpers__/mocks'
import { tempDir } from './__helpers__/path'
import ProcessedSource from './__helpers__/processed-source'
import { createCompiler } from './compiler'
import { ConfigSet } from './config/config-set'
import { TsJestGlobalOptions } from './types'

const logTarget = logTargetMock()

// not really unit-testing here, but it's hard to mock all those values :-D
function makeCompiler({
  jestConfig,
  tsJestConfig,
  parentConfig,
}: {
  jestConfig?: Partial<Config.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
} = {}) {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  const cs = new ConfigSet(fakers.jestConfig(jestConfig, tsJestConfig), parentConfig)
  return createCompiler(cs)
}

beforeEach(() => {
  logTarget.clear()
})

describe('typings', () => {
  const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } })
  it('should report diagnostics related to typings', () => {
    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
"TypeScript diagnostics (customize using \`[jest-config].globals.ts-jest.diagnostics\` option):
foo.ts(3,7): error TS2322: Type 'number' is not assignable to type 'string'.
foo.ts(4,7): error TS2322: Type 'string' is not assignable to type 'boolean'."
`)
  })
})

describe('source-maps', () => {
  const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } })
  it('should have correct source maps', () => {
    const source = 'const f = (v: number) => v\nconst t: number = f(5)'
    const compiled = compiler.compile(source, __filename)
    const processed = new ProcessedSource(compiled, __filename)
    // const expectedFileName = relativeToRoot(__filename)
    const expectedFileName = __filename
    expect(processed.outputSourceMaps).toMatchObject({
      file: expectedFileName,
      sources: [expectedFileName],
      sourcesContent: [source],
    })
  })
})

describe('cache', () => {
  const tmp = tempDir('compiler')
  const compiler = makeCompiler({
    jestConfig: { cache: true, cacheDirectory: tmp },
    tsJestConfig: { tsConfig: false },
  })
  const source = 'console.log("hello")'

  it('should use the cache', () => {
    const compiled1 = compiler.compile(source, __filename)
    expect(logTarget.filteredLines(LogLevels.debug, Infinity)).toMatchInlineSnapshot(`
Array [
  "[level:20] readThrough(): cache miss
",
  "[level:20] getOutput(): compiling using language service
",
  "[level:20] updateMemoryCache()
",
  "[level:20] visitSourceFileNode(): hoisting
",
  "[level:20] getOutput(): computing diagnostics
",
  "[level:20] readThrough(): writing caches
",
]
`)

    logTarget.clear()
    const compiled2 = compiler.compile(source, __filename)
    expect(logTarget.lines).toMatchInlineSnapshot(`
Array [
  "[level:20] readThrough(): cache hit
",
]
`)

    expect(new ProcessedSource(compiled1, __filename)).toMatchSnapshot()
    expect(compiled2).toBe(compiled1)
  })
})

describe('isolatedModules', () => {
  const compiler = makeCompiler({ tsJestConfig: { isolatedModules: true, tsConfig: false } })
  const spy = jest.spyOn(require('typescript'), 'transpileModule')
  afterAll(() => {
    spy.mockRestore()
  })
  it('should compile using transpileModule', () => {
    const compiled = compiler.compile('export default 42', __filename)
    expect(new ProcessedSource(compiled, __filename)).toMatchSnapshot()
    expect(spy).toHaveBeenCalled()
  })
})

describe('allowJs', () => {
  const compiler = makeCompiler({ tsJestConfig: { tsConfig: { allowJs: true } } })
  const fileName = `${__filename}.test.js`
  afterAll(() => {
    removeSync(fileName)
  })
  it('should compile js file', () => {
    const source = 'export default 42'
    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)
    const processed = new ProcessedSource(compiled, fileName)
    expect(processed).toMatchSnapshot()
  })
})

describe('getTypeInfo', () => {
  const compiler = makeCompiler({ tsJestConfig: { tsConfig: false } })
  const source = `
type MyType {
  /** the prop 1! */
  p1: boolean
}
const val: MyType = {} as any
console.log(val.p1/* <== that */)
`
  it('should get correct type info', () => {
    const ti = compiler.getTypeInfo(source, __filename, source.indexOf('/* <== that */') - 1)
    // before TS 3.1 the comment had an extra tailing space
    ti.comment = ti.comment.trim()
    expect(ti).toEqual({
      comment: 'the prop 1!',
      name: '(property) p1: boolean',
    })
  })
})
