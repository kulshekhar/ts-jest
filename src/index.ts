import { createJestPreset } from './config/create-jest-preset'
import { pathsToModuleNameMapper } from './config/paths-to-module-name-mapper'
import { TsJestTransformer } from './ts-jest-transformer'
import { TsJestGlobalOptions } from './types'
import { VersionCheckers } from './util/version-checkers'

// tslint:disable-next-line:no-var-requires
export const version: string = require('../package.json').version

let transformer!: TsJestTransformer
function defaultTransformer(): TsJestTransformer {
  return transformer || (transformer = createTransformer())
}

export function createTransformer(baseConfig?: TsJestGlobalOptions) {
  VersionCheckers.jest.warn()
  return new TsJestTransformer(baseConfig)
}
/**
 * @internal
 */
export function process(...args: any[]): any {
  return (defaultTransformer().process as any)(...args)
}
/**
 * @internal
 */
export function getCacheKey(...args: any[]): any {
  return (defaultTransformer().getCacheKey as any)(...args)
}

/**
 * @internal
 */
// we let jest doing the instrumentation, it does it well
export const canInstrument = false

const jestPreset = createJestPreset()

/**
 * @internal
 */
// for tests
// tslint:disable-next-line:variable-name
export const __singleton = () => transformer
/**
 * @internal
 */
// tslint:disable-next-line:variable-name
export const __resetModule = () => (transformer = undefined as any)

export {
  // extra ==================
  createJestPreset,
  jestPreset,
  pathsToModuleNameMapper,
}
