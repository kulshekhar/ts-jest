import stringify from 'fast-json-stable-stringify'

import { createTransformer } from '.'

describe('configFor', () => {
  it('should return the same config-set for same values', () => {
    const obj1 = { cwd: '/foo', rootDir: '/bar', globals: {} }
    const obj2 = { ...obj1 }
    const str = stringify(obj1)
    const cs1 = createTransformer().configsFor(obj1 as any)
    const cs2 = createTransformer().configsFor(obj2 as any)
    const cs3 = createTransformer().configsFor(str)
    expect(cs1.cwd).toBe('/foo')
    expect(cs1.rootDir).toBe('/bar')
    expect(cs2).toBe(cs1)
    expect(cs3).toBe(cs1)
  })
})
