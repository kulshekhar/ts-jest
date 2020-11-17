import { VersionCheckers } from './utils/version-checkers'
import { TsJestTransformer } from './ts-jest-transformer'

export function createTransformer(): TsJestTransformer {
  VersionCheckers.jest.warn()

  return new TsJestTransformer()
}
