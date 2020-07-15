import * as path from 'path'
import { findConfigFile, sys, readConfigFile, parseJsonConfigFileContent, ParsedCommandLine } from 'typescript'

export const getTsConfig = (dir: string): ParsedCommandLine | undefined => {
  const tsConfigPath = findConfigFile(dir, sys.fileExists)

  if (!tsConfigPath) {
    return
  }

  const readResult = readConfigFile(tsConfigPath, sys.readFile)

  return parseJsonConfigFileContent(readResult.config, sys, path.dirname(tsConfigPath))
}
