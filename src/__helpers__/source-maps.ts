// WARNING: this file is shared between e2e and unit tests
import { RawSourceMap } from 'source-map'
import bufferFrom from 'buffer-from'
import { relative, isAbsolute, resolve } from 'path'
import stableStringify = require('fast-json-stable-stringify')
import { realpathSync } from 'fs'

// source-map module doesn't provide a sync method to extract the source-maps
export function extractSourceMaps(source: string): RawSourceMap | undefined {
  const [, comment]: [any, string | undefined] =
    (source.match(
      /[\n^]\/\/#\s*sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,(\S+)\s*$/,
    ) as any) || []
  if (!comment) return

  return base64ToSourceMaps(comment)
}

export function base64ToSourceMaps(base64: string): RawSourceMap {
  return JSON.parse(bufferFrom(base64, 'base64').toString('utf8'))
}

export function sourceMapsToBase64(sourceMaps: RawSourceMap): string {
  return bufferFrom(stableStringify(sourceMaps)).toString('base64')
}

export function relativiseSourceRoot(
  fromPath: string,
  source: string,
  prefix: string = '',
): string {
  const from = realpathSync(fromPath)
  const remap = (path: string): string =>
    (isAbsolute(path)
      ? `${prefix}${relative(from, realpathSync(path))}`
      : path
    ).replace(/\\/g, '/')

  return source.replace(
    /([\n^]\/\/#\s*sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,)(\S+)(\s*)$/,
    (_, before, base64, after) => {
      const map = base64ToSourceMaps(base64)
      if (map.sourceRoot) map.sourceRoot = remap(map.sourceRoot)
      if (map.sources) map.sources = map.sources.map(remap)
      if (map.file) map.file = remap(map.file)
      return `${before}${sourceMapsToBase64(map)}${after}`
    },
  )
}
