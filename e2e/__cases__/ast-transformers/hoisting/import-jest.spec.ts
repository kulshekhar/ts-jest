import {test,jest} from '@jest/globals'
import {jest as aliasedJest} from '@jest/globals'
import * as JestGlobals from '@jest/globals'

import a from './__test_modules__/a'
import b from './__test_modules__/b'
import c from './__test_modules__/c'

// These will be hoisted above imports
jest.unmock('./__test_modules__/a')
aliasedJest.unmock('./__test_modules__/b')
JestGlobals.jest.unmock('./__test_modules__/c')

// tests

test('named import', () => {
  // @ts-expect-error
  expect(a._isMockFunction).toBeUndefined()
  expect(a()).toBe('unmocked')
})

test('aliased named import', () => {
  // @ts-expect-error
  expect(b._isMockFunction).toBeUndefined()
  expect(b()).toBe('unmocked')
})

test('namespace import', () => {
  // @ts-expect-error
  expect(c._isMockFunction).toBeUndefined()
  expect(c()).toBe('unmocked')
})

