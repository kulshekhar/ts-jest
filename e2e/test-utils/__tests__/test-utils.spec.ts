import utils from '../../../utils'

test('should expose mocked/createJestPreset/pathsToModuleNameMapper', () => {
  expect(Object.keys(utils)).toEqual(['mocked', 'createJestPreset', 'pathsToModuleNameMapper'])
  expect(typeof utils.mocked).toBe('function')
  expect(typeof utils.createJestPreset).toBe('function')
  expect(typeof utils.pathsToModuleNameMapper).toBe('function')
})
