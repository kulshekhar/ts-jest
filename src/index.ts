import { TsJestTransformer } from './legacy/ts-jest-transformer'

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
  createTransformer() {
    return new TsJestTransformer()
  },
}
