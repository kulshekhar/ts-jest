import * as path from 'path'

const MatchWinSeparator = /(?<!\\)(\\)(?!\\)/gm

export const getWinPath = (...paths: string[]): string => {
  const joinedPath = path.join(...paths)

  return joinedPath.replace(MatchWinSeparator, '\\\\')
}

export const getOsPath = (...paths: string[]): string =>
  process.platform === 'win32' ? getWinPath(...paths) : path.join(...paths)
