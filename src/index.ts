import { TsJestTransformer } from './ts-jest-transformer'

export function createTransformer(): TsJestTransformer {
  return new TsJestTransformer()
}
