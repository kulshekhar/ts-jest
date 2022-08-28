import { TsJestTransformer } from './legacy/ts-jest-transformer'
import type { TsJestGlobalOptions } from './types'

export * from './config'
export * from './constants'
export * from './legacy/compiler'
export * from './legacy/ts-jest-transformer'
export * from './legacy/config/config-set'
export * from './presets/create-jest-preset'
export * from './raw-compiler-options'
export * from './utils'
export * from './types'

export default {
  createTransformer(tsJestConfig?: TsJestGlobalOptions) {
    return new TsJestTransformer(tsJestConfig)
  },
}
