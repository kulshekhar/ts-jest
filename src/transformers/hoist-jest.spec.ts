import { testing } from 'bs-logger'
import * as tsc from 'typescript'

import * as hoist from './hoist-jest'

const CODE_WITH_HOISTING_NO_JEST_GLOBALS = `
import Unmocked from './__test_modules__/Unmocked'
import a from './__test_modules__/a'
import b from './__test_modules__/b'
import c from './__test_modules__/c'
import d from './__test_modules__/d'

// These will all be hoisted above imports
jest.deepUnmock('./__test_modules__/Unmocked')
jest.unmock('./__test_modules__/c').unmock('./__test_modules__/d')

// These will not be hoisted
jest.unmock('./__test_modules__/a').dontMock('./__test_modules__/b')
jest.unmock('./__test_modules__/' + 'a')

console.log(Unmocked)
console.log(a)
console.log(b)
console.log(c)
console.log(d)
`
const CODE_WITH_HOISTING_HAS_JEST_GLOBALS = `
  import a from '../__test_modules__/a';
  import b from '../__test_modules__/b';

  import {jest} from '@jest/globals';
  import {jest as aliasedJest} from '@jest/globals';
  import * as JestGlobals from '@jest/globals';

  import c from '../__test_modules__/c';
  import d from '../__test_modules__/d';

  // These will be hoisted above imports

  jest.unmock('../__test_modules__/a');
  aliasedJest.unmock('../__test_modules__/b');
  JestGlobals.jest.unmock('../__test_modules__/c');

  // These will not be hoisted above imports

  {
    const jest = {unmock: () => {}};
    jest.unmock('../__test_modules__/d');
  }

  console.log(a)
  console.log(b)
  console.log(c)
  console.log(d)
`

const logger = testing.createLoggerMock()
const createFactory = () => hoist.factory({ logger, compilerModule: tsc } as any)
const transpile = (source: string) => tsc.transpileModule(source, { transformers: { before: [createFactory()] } })

describe('hoisting', () => {
  it('should have correct signature', () => {
    expect(hoist.name).toBe('hoisting-jest-mock')
    expect(typeof hoist.version).toBe('number')
    expect(hoist.version).toBeGreaterThan(0)
    expect(typeof hoist.factory).toBe('function')
  })

  // TODO: import alias and import * are not hoisted correctly yet, will need to fix
  it.each([CODE_WITH_HOISTING_NO_JEST_GLOBALS, CODE_WITH_HOISTING_HAS_JEST_GLOBALS])(
    'should hoist correctly jest methods',
    (data) => {
      const out = transpile(data)

      expect(out.outputText).toMatchSnapshot()
    },
  )
})
