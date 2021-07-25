// WARNING: this file is shared between e2e and unit tests
import { realpathSync } from 'fs'
import { isAbsolute, relative } from 'path'

import stableStringify = require('fast-json-stable-stringify')
import type { RawSourceMap } from 'source-map'

export function base64ToSourceMaps(base64: string): RawSourceMap {
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
}

export function sourceMapsToBase64(sourceMaps: RawSourceMap): string {
  return Buffer.from(stableStringify(sourceMaps)).toString('base64')
}

export interface ParsedSourceWithMaps {
  sourceMaps?: RawSourceMap
  comment?: string
  source: string
}
export function parseSource(source: string): ParsedSourceWithMaps {
  const [comment, b64Maps]: [string, string | undefined] =
    // eslint-disable-next-line
    (source.match(/[\n^]\/\/#\s*sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,(\S+)\s*$/) as any) ||
    []
  if (b64Maps) {
    const map = base64ToSourceMaps(b64Maps)

    return {
      source: source.substr(0, -comment.length),
      comment: comment.trim(),
      sourceMaps: map,
    }
  }

  return { source }
}

// source-map module doesn't provide a sync method to extract the source-maps
export function extractSourceMaps(source: string): RawSourceMap | undefined {
  return parseSource(source).sourceMaps
}

export function relativisePaths(map: RawSourceMap, fromPath: string, newPrefix = ''): RawSourceMap {
  const res = { ...map }
  const from = realpathSync(fromPath)
  const remap = (path: string): string =>
    (isAbsolute(path) ? `${newPrefix}${relative(from, realpathSync(path))}` : path).replace(/\\/g, '/')
  if (res.sourceRoot) res.sourceRoot = remap(res.sourceRoot)
  if (res.sources) res.sources = res.sources.map(remap)
  if (res.file) res.file = remap(res.file)

  return res
}

export function rewriteSourceMaps(source: string, sourceMapsTransformer: (maps: RawSourceMap) => RawSourceMap): string {
  return source.replace(
    /([\n^]\/\/#\s*sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,)(\S+)(\s*)$/,
    (_, before: string, base64: string, after: string) => {
      let map = base64ToSourceMaps(base64)
      map = sourceMapsTransformer(map)

      return `${before}${sourceMapsToBase64(map)}${after}`
    },
  )
}
