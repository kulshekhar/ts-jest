import { TsJestTransformer } from './ts-jest-transformer'
import { createJestPreset } from './config/create-jest-preset'
import { TsJestGlobalOptions } from './types'
import { VersionCheckers } from './util/version-checkers'

// tslint:disable-next-line:no-var-requires
const version: string = require('../package.json').version

let transformer!: TsJestTransformer
function defaultTransformer(): TsJestTransformer {
  return transformer || (transformer = createTransformer())
}

function createTransformer(baseConfig?: TsJestGlobalOptions) {
  VersionCheckers.jest.warn()
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
  version,
  // jest API ===============
  createTransformer,
  tsProcess as process,
  getCacheKey,
  // extra ==================
  createJestPreset,
  jestPreset,
  // tests ==================
  __singleton,
  __resetModule,
}
