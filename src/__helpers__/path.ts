import { tmpdir } from 'os'
import { join, resolve } from 'path'

import { ensureDirSync } from 'fs-extra'

export const ROOT = resolve(__dirname, '..', '..')

export function tempDir(ns: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dir = join(tmpdir(), 'ts-jest-unit-tests', ns, parseInt((Math.random() * 1e17) as any, 10).toString(36))
  ensureDirSync(dir)

  return dir
}

export const mockFolder = join(process.cwd(), 'src', '__mocks__')
