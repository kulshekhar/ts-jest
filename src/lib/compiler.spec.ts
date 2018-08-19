import { TsJestGlobalOptions } from './types'
import { ConfigSet } from './config-set'
import * as fakers from '../__helpers__/fakers'
import { createCompiler } from './compiler'
import outdent from 'outdent'

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
error TS5052: Option 'declarationDir' cannot be specified without specifying option 'declaration'.
error TS5053: Option 'declarationDir' cannot be specified with option 'outFile'.
error TS6082: Only 'amd' and 'system' modules are supported alongside --outFile.
[eval].ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.
"
`)
  })
})
