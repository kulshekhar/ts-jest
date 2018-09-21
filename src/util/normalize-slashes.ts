/**
 * @internal
 */
export function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/')
}
