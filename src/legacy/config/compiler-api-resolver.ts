import type { Logger } from 'bs-logger'

import type { TTypeScript } from '../../types'
import { Importer, importer as defaultImporter } from '../../utils/importer'
import { Errors, Helps, ImportReasons, interpolate } from '../../utils/messages'

/**
 * The official compatibility package that re-exports the TypeScript 6.x JS compiler API,
 * designed by the TypeScript team to be installed alongside native TypeScript 7+.
 *
 * @internal
 */
export const TYPESCRIPT6_COMPAT_PACKAGE = '@typescript/typescript6'

/**
 * Feature-probe for the JS compiler API surface ts-jest relies on.
 *
 * Native TypeScript 7+ resolves `require('typescript')` to a version-only entry point, so a
 * semver check is not enough (npm aliases can also make version numbers lie in both directions).
 *
 * @internal
 */
export function hasJsCompilerApi(mod: unknown): mod is TTypeScript {
  return (
    !!mod &&
    typeof (mod as TTypeScript).transpileModule === 'function' &&
    typeof (mod as TTypeScript).createLanguageService === 'function' &&
    typeof (mod as TTypeScript).parseJsonConfigFileContent === 'function'
  )
}

/**
 * @internal
 */
export interface ResolvedCompilerApi {
  module: TTypeScript
  /** The module specifier the API was loaded from (`typescript`, `@typescript/typescript6`, or the `compiler` option value) */
  moduleName: string
  /** `true` when the project's `typescript` package exists but is native TypeScript without a JS API (v7+) */
  nativeTypeScriptPresent: boolean
  /** Version of the project's native `typescript` package, when {@link ResolvedCompilerApi.nativeTypeScriptPresent} */
  nativeTypeScriptVersion: string | undefined
}

const versionOf = (mod: unknown): string =>
  (mod as { version?: string } | undefined)?.version ?? /* istanbul ignore next */ 'unknown'

/**
 * Resolve the module providing the TypeScript JS compiler API for ts-jest internals.
 *
 * Resolution order:
 * 1. an explicit non-default `compiler` option — honored strictly; a module without the JS API is
 *    an error (never a silent fallback, the user asked for that exact module)
 * 2. the project's `typescript` package, when it still exposes the JS API (TypeScript <= 6.x)
 * 3. the official `@typescript/typescript6` compatibility package, when the project's `typescript`
 *    is native TypeScript 7+ (or missing)
 * 4. an actionable error explaining how to fix the setup
 *
 * @internal
 */
export function resolveCompilerApi(
  compilerOption: string | undefined,
  logger: Logger,
  importer: Importer = defaultImporter,
): ResolvedCompilerApi {
  // 1) explicit compiler option: strict, no fallback
  if (compilerOption && compilerOption !== 'typescript') {
    const mod = importer.typescript(ImportReasons.TsJest, compilerOption)
    if (!hasJsCompilerApi(mod)) {
      throw new Error(
        interpolate(Errors.CompilerModuleWithoutJsApi, { module: compilerOption, version: versionOf(mod) }),
      )
    }

    return {
      module: mod,
      moduleName: compilerOption,
      nativeTypeScriptPresent: false,
      nativeTypeScriptVersion: undefined,
    }
  }

  // 2) the project's `typescript`, when it still has the JS API
  const tsResult = importer.tryThese('typescript')
  const tsExports: unknown = tsResult && !tsResult.error ? tsResult.exports : undefined
  if (hasJsCompilerApi(tsExports)) {
    return {
      module: tsExports,
      moduleName: 'typescript',
      nativeTypeScriptPresent: false,
      nativeTypeScriptVersion: undefined,
    }
  }
  const nativeTypeScriptPresent = !!tsExports
  const nativeTypeScriptVersion = nativeTypeScriptPresent ? versionOf(tsExports) : undefined

  // 3) the official compatibility package
  const compatResult = importer.tryThese(TYPESCRIPT6_COMPAT_PACKAGE)
  const compatExports: unknown = compatResult && !compatResult.error ? compatResult.exports : undefined
  if (hasJsCompilerApi(compatExports)) {
    if (nativeTypeScriptPresent) {
      logger.info(
        interpolate(Helps.UsingTypescript6CompatPackage, {
          version: nativeTypeScriptVersion,
          compatVersion: versionOf(compatExports),
        }),
      )
    }

    return {
      module: compatExports,
      moduleName: TYPESCRIPT6_COMPAT_PACKAGE,
      nativeTypeScriptPresent,
      nativeTypeScriptVersion,
    }
  }

  // 4) actionable errors
  if (nativeTypeScriptPresent) {
    throw new Error(interpolate(Errors.NativeTypeScriptWithoutCompatPackage, { version: nativeTypeScriptVersion }))
  }

  // `typescript` is missing entirely (or failed loading): keep the historical error message/behavior
  return {
    module: importer.typescript(ImportReasons.TsJest, 'typescript'),
    moduleName: 'typescript',
    nativeTypeScriptPresent: false,
    nativeTypeScriptVersion: undefined,
  }
}
