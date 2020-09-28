import * as utils from 'ts-jest/utils'

test('utils', () => {
  expect(Object.keys(utils)).toEqual(['mocked', 'createJestPreset', 'pathsToModuleNameMapper'])
  expect(typeof utils.mocked).toBe('function')
  expect(typeof utils.createJestPreset).toBe('function')
  expect(typeof utils.pathsToModuleNameMapper).toBe('function')
})
