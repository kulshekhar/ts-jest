/* eslint-disable no-redeclare */
import stableStringify = require('fast-json-stable-stringify')

const UNDEFINED = 'undefined'

/**
 * @internal
 */
export function stringify(input: any): string {
  return input === undefined ? UNDEFINED : stableStringify(input)
}

/**
 * @internal
 */
export function parse(input: string): any {
  return input === UNDEFINED ? undefined : JSON.parse(input)
}

interface NormalizeOptions {
  parse?: (input: string) => any
}
/**
 * @internal
 */
export function normalize(input: string, { parse: parser = parse }: NormalizeOptions = {}): string {
  let result: string | undefined
  if (normalize.cache.has(input)) {
    result = normalize.cache.get(input)
  } else {
    const data = parser(input)
    result = stringify(data)
    if (result === input) result = undefined
    normalize.cache.set(input, result)
  }
  return result === undefined ? input : result
}

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace normalize {
  export const cache = new Map<string, string | undefined>()
}
