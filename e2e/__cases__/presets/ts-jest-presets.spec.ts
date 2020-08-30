// preset and utils should work all the time
import * as presets from 'ts-jest/presets'

test('presets', () => {
  const presetKeys = ['transform']
  expect(presets.defaults).toEqual(require('ts-jest/dist/presets').defaults)
  expect(Object.keys(presets.defaults)).toEqual(presetKeys)
  expect(presets.jsWithBabel).toEqual(require('ts-jest/dist/presets').jsWithBabel)
  expect(Object.keys(presets.jsWithBabel)).toEqual(presetKeys)
  expect(presets.jsWithTs).toEqual(require('ts-jest/dist/presets').jsWithTs)
  expect(Object.keys(presets.jsWithTs)).toEqual(presetKeys)
})
