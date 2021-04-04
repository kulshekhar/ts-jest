import tsJestPresets from '../../../presets'
import type { RawCompilerOptions } from "../../../src/raw-compiler-options";
import { PackageSets } from '../../__helpers__/templates'
import { configureTestCase } from '../../__helpers__/test-case'
import { nodeWithESMSupport } from '../../__helpers__/test-case/utils'

// eslint-disable-next-line no-console
console.log = jest.fn()

// None = 0,
// CommonJS = 1,
// AMD = 2,
// UMD = 3,
// System = 4,
// ES2015 = 5,
// ESNext = 6
type TestOptions = Pick<RawCompilerOptions, 'module' | 'allowSyntheticDefaultImports' | 'esModuleInterop'>
// eslint-disable-next-line jest/no-export
export const enum AllPreset {
  DEFAULT = 'default',
  DEFAULT_ESM = 'default-esm',
  JS_WITH_TS_ESM = 'js-with-ts-esm',
  JS_WITH_BABEL_ESM = 'js-with-babel-esm',
}
type AllPresetType = AllPreset.DEFAULT | AllPreset.DEFAULT_ESM | AllPreset.JS_WITH_TS_ESM | AllPreset.JS_WITH_BABEL_ESM

const runTestForOptions = (options: TestOptions, preset: AllPresetType = AllPreset.DEFAULT): void => {
  const packageSets = preset === AllPreset.JS_WITH_BABEL_ESM ? [PackageSets.babel7, PackageSets.babel7StringConfig] : [PackageSets.default]
  let tsJestPresetToUse
  switch (preset) {
    case AllPreset.DEFAULT_ESM:
      tsJestPresetToUse = tsJestPresets.defaultsESM
      break
    case AllPreset.JS_WITH_TS_ESM:
      tsJestPresetToUse = tsJestPresets.jsWithTsESM
      break
    case AllPreset.JS_WITH_BABEL_ESM:
      tsJestPresetToUse = tsJestPresets.jsWithBabelESM
      break
    default:
      tsJestPresetToUse = tsJestPresets.defaults
  }
  const testCase = configureTestCase('module-kinds',
    {
      jestConfig: tsJestPresetToUse,
      tsJestConfig: { tsconfig: options, diagnostics: { warnOnly: true } },
      noCache: true,
    },
  )

  testCase.runWithTemplates(packageSets, 0, (runTest, { templateName }) => {
    it(`run with options: ${JSON.stringify(options)} with template ${templateName}`, () => {
      const result = runTest()

      expect(result).toMatchSnapshot()
    })
  })
}

// eslint-disable-next-line jest/no-export
export const runTestCases = (moduleKind: RawCompilerOptions['module'], preset: AllPresetType = AllPreset.DEFAULT): void => {
  runTestForOptions({ module: moduleKind }, preset)
  runTestForOptions({ module: moduleKind, allowSyntheticDefaultImports: false }, preset)
  runTestForOptions({ module: moduleKind, allowSyntheticDefaultImports: true }, preset)
  runTestForOptions({ module: moduleKind, esModuleInterop: true }, preset)
  runTestForOptions({ module: moduleKind, esModuleInterop: false }, preset)
}

// eslint-disable-next-line jest/no-export
export const esmOnly = nodeWithESMSupport ? describe : describe.skip;
