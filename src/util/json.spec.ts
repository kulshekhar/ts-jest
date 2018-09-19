import { normalize, parse, stringify } from './json'

describe('stringify/parse', () => {
  it('should (de)serialize undefined', () => {
    const val = undefined
    const serialized = stringify(val)
    expect(typeof serialized).toBe('string')
    expect(parse(serialized)).toBeUndefined()
  })

  it('should keep the same order of keys', () => {
    const str1 = stringify({ one: 1, two: 2 })
    const str2 = stringify({ two: 2, one: 1 })
    expect(str1).toBe(str2)
  })
})

describe('normalize', () => {
  beforeEach(() => {
    normalize.cache.clear()
  })

  it('should re-order keys', () => {
    const expected = '{"one":1,"two":2}'
    const input = '{"two":2,"one":1}'
    expect(normalize(input)).toBe(expected)
  })
  it('should use custom parser if given', () => {
    expect(normalize('foo bar', { parse: () => 'bar foo' })).toBe('"bar foo"')
  })
  it('should cache the result', () => {
    const parse = jest.fn(() => 'foo')
    expect(normalize('bar', { parse })).toBe('"foo"')
    expect(parse).toHaveBeenCalledTimes(1)
    expect(normalize('bar', { parse })).toBe('"foo"')
    expect(parse).toHaveBeenCalledTimes(1)
  })
})
