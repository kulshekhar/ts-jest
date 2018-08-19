import { resolve, relative, join } from 'path'
import { tmpdir } from 'os'
import { ensureDirSync } from 'fs-extra'

export const ROOT = resolve(__dirname, '..', '..')

export function relativeToRoot(path: string) {
  return relative(ROOT, path)
}

export function tempDir(ns: string) {
  const dir = join(
    tmpdir(),
    `ts-jest-unit-tests`,
    ns,
    parseInt((Math.random() * 1e17) as any, 10).toString(36),
  )
  ensureDirSync(dir)
  return dir
}
