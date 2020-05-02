import { LogContexts, LogLevels } from 'bs-logger'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { createJestPreset as createJestPresetCore } from './config/create-jest-preset'
import { pathsToModuleNameMapper as pathsToModuleNameMapperCore } from './config/paths-to-module-name-mapper'
import { TsJestTransformer } from './ts-jest-transformer'
import { TsJestGlobalOptions } from './types'
import { rootLogger } from './util/logger'
import { Deprecateds, interpolate } from './util/messages'
import { mocked as mockedCore } from './util/testing'
import { VersionCheckers } from './util/version-checkers'

// deprecate helpers
const warn = rootLogger.child({ [LogContexts.logLevel]: LogLevels.warn })
const helperMoved = <T extends (...args: any[]) => any>(name: string, helper: T) =>
  warn.wrap(interpolate(Deprecateds.HelperMovedToUtils, { helper: name }), helper)

/** @deprecated */
export const mocked = helperMoved('mocked', mockedCore)
/** @deprecated */
export const createJestPreset = helperMoved('createJestPreset', createJestPresetCore)
/** @deprecated */
export const pathsToModuleNameMapper = helperMoved('pathsToModuleNameMapper', pathsToModuleNameMapperCore)

export const version: string = require('../package.json').version
export const digest: string = readFileSync(resolve(__dirname, '..', '.ts-jest-digest'), 'utf8')

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

const jestPreset = createJestPresetCore()

/**
 * @internal
 */
// for tests
export const __singleton = () => transformer
/**
 * @internal
 */
export const __resetModule = () => (transformer = undefined as any)

export {
  // extra ==================
  jestPreset,
}
