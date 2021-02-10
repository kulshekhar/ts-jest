import ts from 'typescript'

import { createConfigSet } from '../__helpers__/fakers'
import { TsCompiler } from '../compiler/ts-compiler'

import * as hoist from './hoist-jest'

const CODE_WITH_HOISTING_NO_JEST_GLOBALS = `
import React from 'react'
import Unmocked from '../__test_modules__/Unmocked'
import Mocked from '../__test_modules__/Mocked'
import {it} from '@jest/globals'
import a from '../__test_modules__/a'
import b from '../__test_modules__/b'
import c from '../__test_modules__/c'
import d from '../__test_modules__/d'
import f from '../__test_modules__/f'
import jestBackticks from '../__test_modules__/jestBackticks'

// The virtual mock call below will be hoisted above this \`require\` call.
const virtualModule = require('virtual-module')

// These will all be hoisted above imports
jest.unmock('react')
jest.deepUnmock('../__test_modules__/Unmocked')
jest.unmock('../__test_modules__/c').unmock('../__test_modules__/d')

let e;
(function () {
  const _getJestObj = 42;
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
      // The \`jest.mock\` transform will allow require, built-ins and globals.
      const path = require('path')
      const array = new Array(3)
      array[0] = path.sep
      return jest.fn(() => array)
    },
  };
})
jest.mock(\`../__test_modules__/jestBackticks\`)
jest.mock('virtual-module', () => 'kiwi', {virtual: true})
// This has types that should be ignored by the out-of-scope variables check.
jest.mock('has-flow-types', () => (props: {children: mixed}) => 3, {
  virtual: true,
})

// These will not be hoisted
jest.unmock('../__test_modules__/a').dontMock('../__test_modules__/b')
jest.unmock('../__test_modules__/' + 'a')
jest.dontMock('../__test_modules__/Mocked')
{
  const jest = {unmock: () => {}};
  // Would error (used before initialization) if hoisted to the top of the scope
  jest.unmock('../__test_modules__/a')
}

// This must not throw an error
const myObject = {mock: () => {}}
myObject.mock('apple', 27)

// Variable names prefixed with \`mock\` (ignore case) should not throw as out-of-scope
const MockMethods = () => {}
jest.mock('../__test_modules__/f', () => MockMethods)

console.log(Unmocked)
console.log(Mocked)
console.log(a)
console.log(b)
console.log(c)
console.log(d)
console.log(e)
console.log(virtualModule)
console.log(jestBackticks)
console.log(it)
`
const CODE_WITH_HOISTING_HAS_JEST_GLOBALS = `
  import a from '../__test_modules__/a'
  import b from '../__test_modules__/b'

  import {it, jest} from '@jest/globals'
  import {jest as aliasedJest} from '@jest/globals'
  import * as JestGlobals from '@jest/globals'

  import c from '../__test_modules__/c'
  import d from '../__test_modules__/d'

  // These will be hoisted above imports

  jest.unmock('../__test_modules__/a')
  aliasedJest.unmock('../__test_modules__/b')
  JestGlobals.jest.unmock('../__test_modules__/c')

  // These will not be hoisted above imports

  {
    const jest = {unmock: () => {}};
    jest.unmock('../__test_modules__/d');
  }

  console.log(a)
  console.log(b)
  console.log(c)
  console.log(d)
  console.log(it)
`

const createFactory = () => hoist.factory(new TsCompiler(createConfigSet(), new Map()))
const transpile = (source: string) => ts.transpileModule(source, { transformers: { before: [createFactory()] } })

describe('hoisting', () => {
  test.each([CODE_WITH_HOISTING_NO_JEST_GLOBALS, CODE_WITH_HOISTING_HAS_JEST_GLOBALS])(
    'should hoist correctly jest methods',
    (data) => {
      const out = transpile(data)

      expect(out.outputText).toMatchSnapshot()
    },
  )
})
