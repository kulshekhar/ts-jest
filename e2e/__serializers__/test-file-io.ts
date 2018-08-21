import { TestFileIo } from '../__helpers__/test-case'
import { safeDump } from 'js-yaml'

export const test = (val: any) => val && val instanceof TestFileIo
export const print = (val: TestFileIo, serialize: any, indent: any) => {
  const sourceMaps = val.normalizedOutputSourceMaps
  const out = [
    `===[ FILE: ${val.filename.replace(/\\/g, '/')} ]${'='.repeat(67 - val.filename.length)}`,
    val.normalizedOutputCode,
    ...(sourceMaps ? [
      `===[ INLINE SOURCE MAPS ]${'='.repeat(55)}`,
      safeDump(sourceMaps, {sortKeys: true, noRefs: true, noCompatMode: true}).trim(),
    ] : []),
    '='.repeat(80),
  ]
    .map(l => indent(l))
    .join('\n')
  return `${out}`
}
