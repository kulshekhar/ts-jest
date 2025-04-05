import { parse, stringify } from './json'

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
