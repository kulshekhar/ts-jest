import * as utils from 'ts-jest/utils'
import { compilerOptions } from './tsconfig.json';

test('utils', () => {
  expect(Object.keys(utils)).toEqual(['mocked', 'createJestPreset', 'pathsToModuleNameMapper'])
  expect(typeof utils.mocked).toBe('function')
  expect(typeof utils.createJestPreset).toBe('function')
  expect(typeof utils.pathsToModuleNameMapper).toBe('function')
})

test('pathsToModuleNameMapper', () => {
  expect(utils.pathsToModuleNameMapper(compilerOptions.paths, { prefix: compilerOptions.baseUrl } )).toEqual({'^foo/(.*)$': 'src/foo/$1'})
})
