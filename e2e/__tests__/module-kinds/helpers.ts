import { configureTestCase } from '../../__helpers__/test-case'

// None = 0,
// CommonJS = 1,
// AMD = 2,
// UMD = 3,
// System = 4,
// ES2015 = 5,
// ESNext = 6

const testCaseForCompilerOpt = (config: any) => configureTestCase('module-kinds', {
    tsJestConfig: { tsConfig: config, diagnostics: { warnOnly: true } },
    noCache: true,
  })

// eslint-disable-next-line jest/no-export
export const runTestForOptions = (options: {
  module: string
  allowSyntheticDefaultImports?: boolean
  esModuleInterop?: boolean
}) => {
  test(`run with options: ${JSON.stringify(options)}`, () => {
    expect(testCaseForCompilerOpt(options).run()).toMatchSnapshot()
  })
}
