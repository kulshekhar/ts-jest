import { TsJestTransformer } from './ts-jest-transformer'

export * from './ts-jest-transformer'

export default {
  createTransformer: (): TsJestTransformer => new TsJestTransformer(),
}
