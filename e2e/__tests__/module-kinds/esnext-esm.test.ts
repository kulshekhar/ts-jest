import { AllPreset, esmOnly as describe, runTestCases } from './helpers'

describe.each([
  AllPreset.DEFAULT_ESM,
  AllPreset.JS_WITH_TS_ESM,
  AllPreset.JS_WITH_BABEL_ESM
])('Module esnext with preset %s', (preset) => {
  runTestCases('esnext', preset)
})
