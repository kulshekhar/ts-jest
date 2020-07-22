import * as path from 'path'

export const getOsPath = (...paths: string[]): string => {
  const joinedPath = path.join(...paths)

  return process.platform === 'win32' ? joinedPath.replace('\\', '\\\\') : joinedPath
}
