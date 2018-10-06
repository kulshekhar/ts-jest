// preset and utils should work all the time
import * as presets from 'ts-jest/presets'
import * as utils from 'ts-jest/utils'

test('presets', () => {
  const presetKeys = ['transform', 'testMatch', 'moduleFileExtensions']
  expect(Object.keys(presets.defaults)).toEqual(presetKeys)
  expect(presets.defaults).toEqual(require('ts-jest/presets/default/jest-preset'))
  expect(presets.defaults).toEqual(require('ts-jest/jest-preset'))
  expect(Object.keys(presets.jsWithTs)).toEqual(presetKeys)
  expect(presets.jsWithTs).toEqual(require('ts-jest/presets/js-with-ts/jest-preset'))
  expect(Object.keys(presets.jsWithBabel)).toEqual(presetKeys)
  expect(presets.jsWithBabel).toEqual(require('ts-jest/presets/js-with-babel/jest-preset'))
})

test('utils', () => {
  expect(Object.keys(utils)).toEqual(['mocked', 'createJestPreset', 'pathsToModuleNameMapper'])
  expect(typeof utils.mocked).toBe('function')
  expect(typeof utils.createJestPreset).toBe('function')
  expect(typeof utils.pathsToModuleNameMapper).toBe('function')
})
