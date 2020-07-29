import { createJestPreset } from '../config/create-jest-preset'
import { pathsToModuleNameMapper } from '../config/paths-to-module-name-mapper'

import * as subject from './index'
import { mocked } from './testing'

describe('exported helpers', () => {
  it('should have mocked', () => {
    expect(subject).toHaveProperty('mocked', mocked)
  })
  it('should have createJestPreset', () => {
    expect(subject).toHaveProperty('createJestPreset', createJestPreset)
  })
  it('should have pathsToModuleNameMapper', () => {
    expect(subject).toHaveProperty('pathsToModuleNameMapper', pathsToModuleNameMapper)
  })
})
