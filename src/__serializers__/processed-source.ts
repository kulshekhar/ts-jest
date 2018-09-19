import { safeDump } from 'js-yaml'

import ProcessedSource from '../__helpers__/processed-source'

export const test = (val: any) => val && val instanceof ProcessedSource
export const print = (val: ProcessedSource, _: any, indent: any) => {
  const sourceMaps = val.normalizedOutputSourceMaps
  const out = [
    `===[ FILE: ${val.filename.replace(/\\/g, '/')} ]${'='.repeat(67 - val.filename.length)}`,
    val.normalizedOutputCode,
    ...(sourceMaps
      ? [
          `===[ INLINE SOURCE MAPS ]${'='.repeat(55)}`,
          safeDump(sourceMaps, {
            sortKeys: true,
            noRefs: true,
            noCompatMode: true,
          }).trim(),
        ]
      : []),
    '='.repeat(80),
  ]
    .map(l => indent(l))
    .join('\n')
  return `${out}`
}
