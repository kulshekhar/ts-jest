import { pathsToModuleNameMapper } from 'ts-jest'

describe('test-utils', () => {
  it('should expose pathsToModuleNameMapper', () => {
    expect(typeof pathsToModuleNameMapper).toBe('function')
  })
})
