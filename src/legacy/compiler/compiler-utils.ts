import { stringify } from '../../utils'

/**
 * Rely on TypeScript compiled output generation which contains this prefix to point to sourcemap location.
 */
export const SOURCE_MAPPING_PREFIX = 'sourceMappingURL='

/**
 * Update the output remapping the source map.
 */
export function updateOutput(outputText: string, normalizedFileName: string, sourceMap?: string): string {
  if (sourceMap) {
    const base64Map = Buffer.from(updateSourceMap(sourceMap, normalizedFileName), 'utf8').toString('base64')
    const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`

    // sourceMappingURL= prefix is always at the end of compiledOutput, using lastIndexOf should be the safest way to substring
    return (
      outputText.slice(0, outputText.lastIndexOf(SOURCE_MAPPING_PREFIX) + SOURCE_MAPPING_PREFIX.length) +
      sourceMapContent
    )
  }

  return outputText
}

/**
 * Update the source map contents for improved output.
 */
const updateSourceMap = (sourceMapText: string, normalizedFileName: string): string => {
  const sourceMap = JSON.parse(sourceMapText)
  sourceMap.file = normalizedFileName
  sourceMap.sources = [normalizedFileName]
  delete sourceMap.sourceRoot

  return stringify(sourceMap)
}
