import type { TBabelCore, TBabelJest, TTypeScript } from '../types'
import type { TEsBuild } from '../types'

import { rootLogger } from './logger'
import { Memoize } from './memoize'
import { Errors, Helps, ImportReasons, interpolate } from './messages'
import { VersionCheckers } from './version-checkers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModulePatcher<T = any> = (module: T) => T

const logger = rootLogger.child({ namespace: 'Importer' })

// When adding an optional dependency which has another reason, add the reason in ImportReasons, and
// create a new method in Importer. Thus uses the importer.yourMethod(ImportReasons.TheReason)
// in the relevant code, so that the user knows why it needs it and how to install it in the
// case it can't import.
interface ImportOptions {
  alternatives?: string[]
  installTip?: string | Array<{ module: string; label: string }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const passThru = (action: () => void) => (input: any) => {
  action()

  return input
}

/**
 * @internal
 */
export class Importer {
  @Memoize()
  static get instance(): Importer {
    logger.debug('creating Importer singleton')

    // here we can define patches to apply to modules.
    // it could be fixes that are not deployed, or
    // abstractions so that multiple versions work the same
    return new Importer({
      '@babel/core': [passThru(VersionCheckers.babelCore.warn)],
      'babel-jest': [passThru(VersionCheckers.babelJest.warn)],
      typescript: [passThru(VersionCheckers.typescript.warn)],
      jest: [passThru(VersionCheckers.jest.warn)],
    })
  }

  constructor(protected _patches: { [moduleName: string]: ModulePatcher[] } = {}) {}

  babelJest(why: ImportReasons): TBabelJest {
    return this._import(why, 'babel-jest')
  }

  babelCore(why: ImportReasons): TBabelCore {
    return this._import(why, '@babel/core')
  }

  typescript(why: ImportReasons, which: string): TTypeScript {
    return this._import(why, which)
  }

  esBuild(why: ImportReasons): TEsBuild {
    return this._import(why, 'esbuild')
  }

  @Memoize((...args: string[]) => args.join(':'))
  tryThese(moduleName: string, ...fallbacks: string[]): RequireResult<true> | undefined {
    let name: string
    let loaded: RequireResult<true> | undefined
    const tries = [moduleName, ...fallbacks]
    while ((name = tries.shift() as string) !== undefined) {
      const req = requireWrapper(name)

      // remove exports from what we're going to log
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contextReq: any = { ...req }
      delete contextReq.exports

      if (req.exists) {
        // module exists
        loaded = req as RequireResult<true>
        if (loaded.error) {
          // require-ing it failed
          logger.error({ requireResult: contextReq }, `failed loading module '${name}'`, loaded.error.message)
        } else {
          // it has been loaded, let's patch it
          logger.debug({ requireResult: contextReq }, 'loaded module', name)
          loaded.exports = this._patch(name, loaded.exports)
        }
        break
      } else {
        // module does not exists in the path
        logger.debug({ requireResult: contextReq }, `module '${name}' not found`)
      }
    }

    // return the loaded one, could be one that has been loaded, or one which has failed during load
    // but not one which does not exists
    return loaded
  }

  tryTheseOr<T>(moduleNames: [string, ...string[]] | string, missingResult: T, allowLoadError?: boolean): T
  // eslint-disable-next-line no-dupe-class-members
  tryTheseOr<T>(moduleNames: [string, ...string[]] | string, missingResult?: T, allowLoadError?: boolean): T | undefined
  // eslint-disable-next-line no-dupe-class-members
  tryTheseOr<T>(moduleNames: [string, ...string[]] | string, missingResult?: T, allowLoadError = false): T | undefined {
    const args: [string, ...string[]] = Array.isArray(moduleNames) ? moduleNames : [moduleNames]
    const result = this.tryThese(...args)
    if (!result) return missingResult
    if (!result.error) return result.exports as T
    if (allowLoadError) return missingResult
    throw result.error
  }

  @Memoize((name) => name)
  protected _patch<T>(name: string, unpatched: T): T {
    if (name in this._patches) {
      logger.debug('patching', name)

      return this._patches[name].reduce((mod, patcher) => patcher(mod), unpatched)
    }

    return unpatched
  }

  protected _import<T>(
    why: string,
    moduleName: string,
    { alternatives = [], installTip = moduleName }: ImportOptions = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): T {
    // try to load any of the alternative after trying main one
    const res = this.tryThese(moduleName, ...alternatives)
    // if we could load one, return it
    if (res && res.exists) {
      if (!res.error) return res.exports
      // it could not load because of a failure while importing, but it exists
      throw new Error(interpolate(Errors.LoadingModuleFailed, { module: res.given, error: res.error.message }))
    }

    // if it couldn't load, build a nice error message so the user can fix it by himself
    const msg = alternatives.length ? Errors.UnableToLoadAnyModule : Errors.UnableToLoadOneModule
    const loadModule = [moduleName, ...alternatives].map((m) => `"${m}"`).join(', ')
    if (typeof installTip === 'string') {
      installTip = [{ module: installTip, label: `install "${installTip}"` }]
    }
    const fix = installTip
      .map((tip) => `    ${installTip.length === 1 ? '↳' : '•'} ${interpolate(Helps.FixMissingModule, tip)}`)
      .join('\n')

    throw new Error(
      interpolate(msg, {
        module: loadModule,
        reason: why,
        fix,
      }),
    )
  }
}

/**
 * @internal
 */
export const importer = Importer.instance

/**
 * @internal
 */
export interface RequireResult<E = boolean> {
  exists: E
  given: string
  path?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exports?: any
  error?: Error
}

function requireWrapper(moduleName: string): RequireResult {
  let path: string
  let exists = false
  try {
    path = resolveModule(moduleName)
    exists = true
  } catch (error) {
    return { error: error as Error, exists, given: moduleName }
  }
  const result: RequireResult = { exists, path, given: moduleName }
  try {
    result.exports = requireModule(path)
  } catch (error) {
    try {
      result.exports = requireModule(moduleName)
    } catch (error) {
      result.error = error as Error
    }
  }

  return result
}

let requireModule = (mod: string) => require(mod)
let resolveModule = (mod: string) => require.resolve(mod, { paths: [process.cwd(), __dirname] })

/**
 * @internal
 */
// so that we can test easier
export function __requireModule(localRequire: typeof requireModule, localResolve: typeof resolveModule): void {
  requireModule = localRequire
  resolveModule = localResolve
}
