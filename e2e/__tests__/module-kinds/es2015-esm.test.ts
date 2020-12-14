import { AllPreset, esmOnly as describe, runTestCases } from './helpers'

describe.each([
  AllPreset.DEFAULT_ESM,
  AllPreset.JS_WITH_TS_ESM,
  AllPreset.JS_WITH_BABEL_ESM
])('Module es2015 with preset %s', (preset) => {
  runTestCases('es2015', preset)
})
