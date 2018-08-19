import { TsJestGlobalOptions } from './types'
import { ConfigSet } from './config-set'
import * as fakers from '../__helpers__/fakers'
import { createCompiler } from './compiler'
import { extractSourceMaps } from '../__helpers__/source-maps'
import { relativeToRoot } from '../__helpers__/path'

// not really unit-testing here, but it's hard to mock all those values :-D

function makeCompiler({
  jestConfig,
  tsJestConfig,
  parentConfig,
}: {
  jestConfig?: jest.ProjectConfig
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

describe('typeCheck', () => {
  const compiler = makeCompiler({ tsJestConfig: { typeCheck: true } })
  it('should report diagnostics related to typings', () => {
    expect(() =>
      compiler.compile(
        'const f = (v: number) => v\nconst t: string = f(5)',
        '[eval].ts',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
"⨯ Unable to compile TypeScript:
[eval].ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.
"
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
