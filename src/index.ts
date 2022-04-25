import { TsJestTransformer } from './legacy'

export * from './legacy'
export * from './constants'
export * from './legacy/compiler'
export * from './config'
export * from './presets/create-jest-preset'
export * from './utils'
export * from './raw-compiler-options'
export * from './types'

export default {
  createTransformer() {
    return new TsJestTransformer(true)
  },
}
