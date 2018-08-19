import { resolve, relative } from 'path'

export const ROOT = resolve(__dirname, '..', '..')

export function relativeToRoot(path: string) {
  return relative(ROOT, path)
}
