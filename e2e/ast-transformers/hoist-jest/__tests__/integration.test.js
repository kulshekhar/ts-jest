import React from 'react'
import Mocked from '../__test_modules__/mocked'
import Unmocked from '../__test_modules__/unmocked'
import a from '../__test_modules__/a'
import b from '../__test_modules__/b'
import c from '../__test_modules__/c'
import d from '../__test_modules__/d'
import f from '../__test_modules__/f'
import jestBackticks from '../__test_modules__/jest-backticks'
// The virtual mock call below will be hoisted above this `require` call.
const virtualModule = require('virtual-module')

// These will all be hoisted above imports
jest.unmock('react')
jest.deepUnmock('../__test_modules__/unmocked')
jest.unmock('../__test_modules__/c').unmock('../__test_modules__/d')

let e
;(function () {
  // eslint-disable-next-line no-unused-vars
  const _getJestObj = 42
  e = require('../__test_modules__/e').default
  // hoisted to the top of the function scope
  jest.unmock('../__test_modules__/e')
})()

jest.mock('../__test_modules__/f', () => {
  if (!global.CALLS) {
    global.CALLS = 0
  }
  global.CALLS++

  return {
    _isMock: true,
    fn: () => {
      // The `jest.mock` transform will allow require, built-ins and globals.
      const path = require('path')
      const array = new Array(3)
      array[0] = path.sep
      return jest.fn(() => array)
    },
  }
})
jest.mock('../__test_modules__/jest-backticks')
jest.mock('virtual-module', () => 'kiwi', { virtual: true })
// This has types that should be ignored by the out-of-scope variables check.
jest.mock('has-flow-types', () => () => 3, {
  virtual: true,
})
jest.mock('../__test_modules__/a')

// These will not be hoisted
jest.unmock('../__test_modules__/a').dontMock('../__test_modules__/b')
jest.dontMock('../__test_modules__/mocked')

{
  const jest = { unmock: () => {} }
  // Would error (used before initialization) if hoisted to the top of the scope
  jest.unmock('../__test_modules__/a')
}

// This must not throw an error
const myObject = { mock: () => {} }
myObject.mock('apple', 27)

// Variable names prefixed with `mock` (ignore case) should not throw as out-of-scope
const MockMethods = () => {}
jest.mock('../__test_modules__/g', () => MockMethods)

describe('hoisting', () => {
  test('does not throw during transform', () => {
    const object = {}
    object.__defineGetter__('foo', () => 'bar')
    expect(object.foo).toEqual('bar')
  })

  test('hoists react unmock call before imports', () => {
    expect(typeof React).toEqual('object')
    expect(React.isValidElement.mock).toBe(undefined)
  })

  test('hoists unmocked modules before imports', () => {
    expect(Unmocked._isMockFunction).toBe(undefined)
    expect(new Unmocked().isUnmocked).toEqual(true)

    expect(c._isMockFunction).toBe(undefined)
    expect(c()).toEqual('unmocked')

    expect(d._isMockFunction).toBe(undefined)
    expect(d()).toEqual('unmocked')

    expect(e._isMock).toBe(undefined)
    expect(e()).toEqual('unmocked')
  })

  test('hoists mock call with 2 arguments', () => {
    const path = require('path')

    expect(f._isMock).toBe(true)

    const mockFn = f.fn()
    expect(mockFn()).toEqual([path.sep, undefined, undefined])
  })

  test('only executes the module factories once', () => {
    jest.resetModules()

    global.CALLS = 0

    require('../__test_modules__/f')
    expect(global.CALLS).toEqual(1)

    require('../__test_modules__/f')
    expect(global.CALLS).toEqual(1)

    delete global.CALLS
  })

  test('does not hoist dontMock calls before imports', () => {
    expect(Mocked._isMockFunction).toBe(true)
    expect(new Mocked().isMocked).toEqual(undefined)

    expect(a._isMockFunction).toBe(true)
    expect(a()).toEqual(undefined)

    expect(b._isMockFunction).toBe(true)
    expect(b()).toEqual(undefined)
  })

  test('requires modules that also call jest.mock', () => {
    require('../mock-file')
    const mock = require('../banana')
    expect(mock).toEqual('apple')
  })

  test('works with virtual modules', () => {
    expect(virtualModule).toBe('kiwi')
  })

  test('works if the file name is mocked via backticks and defined in the "__mocks__" directory', () => {
    expect(jestBackticks.name).toBe('backticks-with-jest')
  })
})
