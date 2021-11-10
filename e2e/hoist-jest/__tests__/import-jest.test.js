import { jest } from '@jest/globals'
import { jest as aliasedJest } from '@jest/globals'
import * as JestGlobals from '@jest/globals'
import a from '../__test_modules__/a'
import b from '../__test_modules__/b'
import c from '../__test_modules__/c'
import d from '../__test_modules__/d'

// These will be hoisted above imports

jest.unmock('../__test_modules__/a')
aliasedJest.unmock('../__test_modules__/b')
JestGlobals.jest.unmock('../__test_modules__/c')

// These will not be hoisted above imports
{
  const jest = { unmock: () => {} }
  jest.unmock('../__test_modules__/d')
}

// tests

test('named import', () => {
  expect(a._isMockFunction).toBe(undefined)
  expect(a()).toBe('unmocked')
})

test('aliased named import', () => {
  expect(b._isMockFunction).toBe(undefined)
  expect(b()).toBe('unmocked')
})

test('namespace import', () => {
  expect(c._isMockFunction).toBe(undefined)
  expect(c()).toBe('unmocked')
})

test('fake jest, shadowed import', () => {
  expect(d._isMockFunction).toBe(true)
  expect(d()).toBe(undefined)
})
