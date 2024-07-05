import type { TsJestTransformerOptions } from '../types'

import { TsJestTransformer } from './ts-jest-transformer'

export default {
  createTransformer: (tsJestConfig?: TsJestTransformerOptions): TsJestTransformer =>
    new TsJestTransformer(tsJestConfig),
}
