import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const typeModuleCache = new Map<string, string[]>()

function isTypeModulePackage(pkgDir: string): boolean {
  try {
    const raw = readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw) as { type?: string }

    return parsed.type === 'module'
  } catch {
    return false
  }
}

function listPkgDirs(nodeModulesDir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(nodeModulesDir)
  } catch {
    return []
  }
  const dirs: string[] = []
  for (const entry of entries) {
    if (entry.startsWith('.')) continue
    const full = path.join(nodeModulesDir, entry)
    if (entry.startsWith('@')) {
      let scoped: string[] = []
      try {
        scoped = readdirSync(full)
      } catch {
        continue
      }
      for (const sub of scoped) {
        if (!sub.startsWith('.')) dirs.push(path.join(full, sub))
      }
    } else {
      dirs.push(full)
    }
  }

  return dirs
}

export function findTypeModulePackages(nodeModulesPath: string): string[] {
  const key = path.resolve(nodeModulesPath)
  const cached = typeModuleCache.get(key)
  if (cached) return cached
  const found = new Set<string>()
  const topNm = path.join(nodeModulesPath, 'node_modules')
  for (const dir of listPkgDirs(topNm)) {
    if (isTypeModulePackage(dir)) {
      const rel = path.relative(topNm, dir).split(path.sep).join('/')
      found.add(rel)
    }
  }
  const result = [...found]
  typeModuleCache.set(key, result)

  return result
}

/** @internal */
export function resetTypeModuleCacheForTesting(): void {
  typeModuleCache.clear()
}
