import type { NodeModulesTransformOptions } from '../types'

import { findTypeModulePackages } from './find-type-module-packages'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a `transformIgnorePatterns` entry that ignores `node_modules` except for
 * specified packages and optional file-extension exemptions. Use when you need
 * ESM packages inside `node_modules` to be transformed by ts-jest.
 *
 * @param options.typeModulePackages - Scan `node_modules` and exempt packages whose
 *   `package.json` declares `"type": "module"`. Default `false`.
 * @param options.mjsPackages - Exempt all `.mjs` files inside `node_modules` from
 *   being ignored, so they are transformed by ts-jest. Default `false`.
 * @param options.packageNames - Additional package names to exempt. Default `[]`.
 * @param options.nodeModulesPath - Directory to scan from. Default `process.cwd()`.
 * @returns A regex string suitable for `transformIgnorePatterns`.
 */
export function nodeModulesTransformPattern({
  typeModulePackages = false,
  mjsPackages = false,
  packageNames = [],
  nodeModulesPath = process.cwd(),
}: NodeModulesTransformOptions = {}): string {
  const allPackages = new Set<string>(packageNames)
  if (typeModulePackages) {
    for (const name of findTypeModulePackages(nodeModulesPath)) {
      allPackages.add(name)
    }
  }

  const parts: string[] = []
  if (allPackages.size) {
    const escaped = [...allPackages].map(escapeRegex).join('|')
    parts.push(`(${escaped})/`)
  }
  if (mjsPackages) {
    parts.push(`.*\\.mjs$`)
  }

  if (!parts.length) return '/node_modules/'

  return `/node_modules/(?!${parts.join('|')})`
}
