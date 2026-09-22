import { pathsToModuleNameMapper } from '../../../dist'

describe('test-utils', () => {
  it('should expose pathsToModuleNameMapper', () => {
    expect(typeof pathsToModuleNameMapper).toBe('function')
  })
})
