import { tmpdir } from 'os'
import { join, resolve } from 'path'

import { ensureDirSync } from 'fs-extra'

export const ROOT = resolve(__dirname, '..', '..')

export function tempDir(ns: string): string {
  const dir = join(tmpdir(), 'ts-jest-unit-tests', ns, parseInt((Math.random() * 1e17) as any, 10).toString(36))
  ensureDirSync(dir)

  return dir
}
