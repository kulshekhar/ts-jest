import { dump } from 'js-yaml'

import ProcessedSource from '../__helpers__/processed-source'

// eslint-disable-next-line
export const test = (val: any): boolean => val && val instanceof ProcessedSource
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const print = (val: ProcessedSource, _: unknown, indent: (str: string) => any): string => {
  const sourceMaps = val.normalizedOutputSourceMaps
  const out = [
    `===[ FILE: ${val.filename.replace(/\\/g, '/')} ]${'='.repeat(67 - val.filename.length)}`,
    val.normalizedOutputCode,
    ...(sourceMaps
      ? [
          `===[ INLINE SOURCE MAPS ]${'='.repeat(55)}`,
          dump(sourceMaps, {
            sortKeys: true,
            noRefs: true,
            noCompatMode: true,
          }).trim(),
        ]
      : []),
    '='.repeat(80),
  ]
    .map((l) => indent(l))
    .join('\n')

  return `${out}`
}
