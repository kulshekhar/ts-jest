import fs from 'node:fs'
import path from 'node:path'

function workspaceRootInner(dir: string, candidateRoot: string) {
  if (path.dirname(dir) === dir) return candidateRoot

  const matchablePaths = [path.join(dir, '.ts-jest-digest'), path.join(dir, '.github'), path.join(dir, 'renovate.json')]
  if (matchablePaths.some((x) => fs.existsSync(x))) {
    return dir
  }

  return workspaceRootInner(path.dirname(dir), candidateRoot)
}

export const workspaceRoot = workspaceRootInner(process.cwd(), process.cwd())
