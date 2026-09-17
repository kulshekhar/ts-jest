import { resolve } from 'path'
import { fileURLToPath } from 'url'

import { updateOutput } from './compiler-utils'

describe('updateOutput', () => {
  it.each(['source-map.test.ts', 'source map.test.ts', 'source#100%.test.ts'])(
    'should preserve the source path as a file URL for %s',
    (fileName) => {
      const sourcePath = resolve('src', fileName)
      const normalizedFileName = sourcePath.replace(/\\/g, '/')
      const sourceMap = {
        version: 3,
        file: 'source-map.test.js',
        sourceRoot: '../original',
        sources: [fileName],
        sourcesContent: ['throw new Error("test")'],
        names: [],
        mappings: 'AAAA',
      }
      const output = updateOutput(
        'throw new Error("test");\n//# sourceMappingURL=source-map.test.js.map',
        normalizedFileName,
        JSON.stringify(sourceMap),
      )
      const updatedMap = JSON.parse(Buffer.from(output.split('base64,')[1], 'base64').toString('utf8'))
      const sourceUrl = new URL(updatedMap.sources[0])

      expect(sourceUrl.protocol).toBe('file:')
      expect(fileURLToPath(sourceUrl)).toBe(sourcePath)
      expect(sourceUrl.hash).toBe('')
      expect(updatedMap.file).toBe(normalizedFileName)
      expect(updatedMap.sourceRoot).toBeUndefined()
      expect(updatedMap.sourcesContent).toEqual(sourceMap.sourcesContent)
      expect(updatedMap.mappings).toBe(sourceMap.mappings)
    },
  )
})
