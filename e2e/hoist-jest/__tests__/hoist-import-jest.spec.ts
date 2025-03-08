// eslint-disable-next-line import/no-duplicates
import { jest } from '@jest/globals'
// eslint-disable-next-line import/no-duplicates
import { jest as aliasedJest } from '@jest/globals'
import * as JestGlobals from '@jest/globals'

import a from '../src/a'
import b from '../src/b'
import c from '../src/c'

jest.unmock('../src/a')
aliasedJest.unmock('../src/b')
JestGlobals.jest.unmock('../src/c')

describe('hoist-import-jest', () => {
  it('should work with named import', () => {
    // @ts-expect-error `_isMockFunction` is a hidden property
    expect(a._isMockFunction).toBeUndefined()
    expect(a()).toBe('unmocked')
  })

  it('should work with aliased named import', () => {
    // @ts-expect-error `_isMockFunction` is a hidden property
    expect(b._isMockFunction).toBeUndefined()
    expect(b()).toBe('unmocked')
  })

  it('should work with namespace import', () => {
    // @ts-expect-error `_isMockFunction` is a hidden property
    expect(c._isMockFunction).toBeUndefined()
    expect(c()).toBe('unmocked')
  })
})
