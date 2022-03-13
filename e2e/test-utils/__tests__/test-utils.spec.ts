import { createJestPreset, pathsToModuleNameMapper } from 'ts-jest'

test('should expose mocked/createJestPreset/pathsToModuleNameMapper', () => {
  expect(typeof createJestPreset).toBe('function')
  expect(typeof pathsToModuleNameMapper).toBe('function')
})
