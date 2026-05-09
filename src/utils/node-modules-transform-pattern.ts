import type { NodeModulesTransformOptions } from '../types'

/**
 * Builds a `transformIgnorePatterns` regex string for a Jest config that needs
 * to transpile select `node_modules` entries.
 *
 * * ⚠️ **WARNING:** do not add any other node_modules transformIgnorePatterns to
 * jest config outside of this function. They will conflict with each other due
 * to nature of regex negative lookaheads.
 *
 * @param options - Controls which packages and file types are included in transpilation.
 * @param options.packageNames - Packages that should not be ignored.
 * @param options.mjsPackages - When true, captures `.mjs` files inside `node_modules`.
 * @returns A single `transformIgnorePatterns` regex string.
 */
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function nodeModulesTransformPattern({
  mjsPackages = false,
  packageNames,
}: NodeModulesTransformOptions): string {
  const exclusions: string[] = []
  if (packageNames?.length) {
    exclusions.push(`(${packageNames.map(escapeRegex).join('|')})/`)
  }
  if (mjsPackages) {
    exclusions.push('.*\\.mjs$')
  }

  return `/node_modules/(?!${exclusions.join('|')})`
}
