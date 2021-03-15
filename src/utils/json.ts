/* eslint-disable no-redeclare */
import stableStringify from 'fast-json-stable-stringify'

const UNDEFINED = 'undefined'

export function stringify(input: unknown): string {
  return input === undefined ? UNDEFINED : stableStringify(input)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parse(input: string): any {
  return input === UNDEFINED ? undefined : JSON.parse(input)
}

interface NormalizeOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
