import stableStringify from 'fast-json-stable-stringify'

const UNDEFINED = 'undefined'

export function stringify(input: unknown): string {
  return input === undefined ? UNDEFINED : stableStringify(input)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parse(input: string): any {
  return input === UNDEFINED ? undefined : JSON.parse(input)
}
