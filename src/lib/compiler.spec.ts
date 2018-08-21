// tslint:disable:max-line-length
import { TsJestGlobalOptions } from './types'
import { ConfigSet } from './config-set'
import * as fakers from '../__helpers__/fakers'
import { createCompiler } from './compiler'
import {
  extractSourceMaps,
  rewriteSourceMaps,
  relativisePaths,
} from '../__helpers__/source-maps'
import { relativeToRoot, tempDir, ROOT } from '../__helpers__/path'
import { __setup } from './debug'

// not really unit-testing here, but it's hard to mock all those values :-D

function makeCompiler({
  jestConfig,
  tsJestConfig,
  parentConfig,
}: {
  jestConfig?: Partial<jest.ProjectConfig>
  tsJestConfig?: TsJestGlobalOptions
  parentConfig?: TsJestGlobalOptions
} = {}) {
  tsJestConfig = { ...tsJestConfig }
  tsJestConfig.diagnostics = {
    ...(tsJestConfig.diagnostics as any),
    pretty: false,
  }
  const cs = new ConfigSet(
    fakers.jestConfig(jestConfig, tsJestConfig),
    parentConfig,
  )
  return createCompiler(cs)
}

const logger = jest.fn()
__setup({ logger })

beforeEach(() => {
  logger.mockClear()
})

describe('typeCheck', () => {
  const compiler = makeCompiler({ tsJestConfig: { typeCheck: true } })
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
"Unable to compile TypeScript (add code(s) in \`[jest-config].globals.ts-jest.diagnostics.ignoreCodes\` to ignore):
foo.ts(3,7): error TS2322: Type 'number' is not assignable to type 'string'.
foo.ts(4,7): error TS2322: Type 'string' is not assignable to type 'boolean'."
`)
  })
})

describe('source-maps', () => {
  const compiler = makeCompiler()
  it('should report diagnostics related to typings', () => {
    const source = 'const f = (v: number) => v\nconst t: number = f(5)'
    const compiled = compiler.compile(source, __filename)
    const expectedFileName = relativeToRoot(__filename)
    expect(extractSourceMaps(compiled)).toMatchObject({
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
  })
  const source = 'console.log("hello")'

  it('should use the cache', () => {
    const compiled1 = compiler.compile(source, __filename)
    expect(logger).toHaveBeenCalledTimes(1)
    expect(logger).toHaveBeenCalledWith(
      'log',
      'ts-jest:',
      'readThrough:cache-miss',
      __filename,
    )

    logger.mockClear()
    const compiled2 = compiler.compile(source, __filename)
    expect(logger).toHaveBeenCalledTimes(1)
    expect(logger).toHaveBeenCalledWith(
      'log',
      'ts-jest:',
      'readThrough:cache-hit',
      __filename,
    )

    expect(rewriteSourceMaps(compiled1, maps => relativisePaths(maps, ROOT)))
      .toMatchInlineSnapshot(`
"\\"use strict\\";
console.log(\\"hello\\");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJmaWxlIjoic3JjL2xpYi9jb21waWxlci5zcGVjLnRzIiwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBIiwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvbGliL2NvbXBpbGVyLnNwZWMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc29sZS5sb2coXCJoZWxsb1wiKSJdLCJ2ZXJzaW9uIjozfQ=="
`)
    expect(compiled2).toBe(compiled1)
  })
})

describe('getTypeInfo', () => {
  const compiler = makeCompiler({ tsJestConfig: { typeCheck: true } })
  const source = `
type MyType {
  /** the prop 1! */
  p1: boolean
}
const val: MyType = {} as any
console.log(val.p1/* <== that */)
`
  it('should get correct type info', () => {
    expect(
      compiler.getTypeInfo(
        source,
        __filename,
        source.indexOf('/* <== that */') - 1,
      ),
    ).toEqual({
      comment: 'the prop 1! ',
      name: '(property) p1: boolean',
    })
  })
})
