import type { TsJestGlobalOptions } from '../types'

import { TsJestTransformer } from './ts-jest-transformer'

export default {
  createTransformer: (tsJestConfig?: TsJestGlobalOptions): TsJestTransformer => new TsJestTransformer(tsJestConfig),
}
