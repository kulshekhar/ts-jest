// preset and utils should work all the time
import * as presets from 'ts-jest/presets'

test('presets', () => {
  const presetKeys = ['transform']
  expect(Object.keys(presets.defaults)).toEqual(presetKeys)
  expect(Object.keys(presets.jsWithBabel)).toEqual(presetKeys)
  expect(Object.keys(presets.jsWithTs)).toEqual(presetKeys)
})
