import { TsJestTransformer } from './lib/ts-jest-transformer'
import { createJestPreset } from './lib/create-jest-preset'
import { TsJestGlobalOptions } from './lib/types'

let transformer!: TsJestTransformer
function defaultTransformer(): TsJestTransformer {
  return transformer || (transformer = new TsJestTransformer())
}

function createTransformer(baseConfig?: TsJestGlobalOptions) {
  return new TsJestTransformer(baseConfig)
}
function tsProcess(...args: any[]): any {
  return (defaultTransformer().process as any)(...args)
}
function getCacheKey(...args: any[]): any {
  return (defaultTransformer().getCacheKey as any)(...args)
}

const jestPreset = createJestPreset()

// for tests
// tslint:disable-next-line:variable-name
const __singleton = () => transformer
// tslint:disable-next-line:variable-name
const __resetModule = () => (transformer = undefined as any)

export {
  // jest API
  createTransformer,
  tsProcess as process,
  getCacheKey,
  // extra
  createJestPreset,
  jestPreset,
  // tests
  __singleton,
  __resetModule,
}
