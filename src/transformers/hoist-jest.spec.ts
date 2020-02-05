import { testing } from 'bs-logger'
import * as tsc from 'typescript'

import * as hoist from './hoist-jest'

const CODE_WITH_HOISTING = `
const foo = 'foo'
console.log(foo)
jest.enableAutomock()
jest.disableAutomock()
jest.mock('./foo')
jest.mock('./foo/bar', () => 'bar')
jest.unmock('./bar/foo').dontMock('./bar/bar')
jest.deepUnmock('./foo')
jest.mock('./foo').mock('./bar')
const func = () => {
  const bar = 'bar'
  console.log(bar)
  jest.unmock('./foo')
  jest.mock('./bar')
  jest.mock('./bar/foo', () => 'foo')
  jest.unmock('./foo/bar')
  jest.unmock('./bar/foo').dontMock('./bar/bar')
  jest.deepUnmock('./bar')
  jest.mock('./foo').mock('./bar')
}
const func2 = () => {
  const bar = 'bar'
  console.log(bar)
  jest.mock('./bar')
  jest.unmock('./foo/bar')
  jest.mock('./bar/foo', () => 'foo')
  jest.unmock('./foo')
  jest.unmock('./bar/foo').dontMock('./bar/bar')
  jest.deepUnmock('./bar')
  jest.mock('./foo').mock('./bar')
}
`
const logger = testing.createLoggerMock()
const createFactory = () => {
  return hoist.factory({ logger, compilerModule: tsc } as any)
}
const transpile = (source: string) => tsc.transpileModule(source, { transformers: { before: [createFactory()] } })

describe('hoisting', () => {
  it('should have correct signature', () => {
    expect(hoist.name).toBe('hoisting-jest-mock')
    expect(typeof hoist.version).toBe('number')
    expect(hoist.version).toBeGreaterThan(0)
    expect(typeof hoist.factory).toBe('function')
  })

  it('should hoist jest.mock(), unmock(), disableAutomock() and enableAutomock()', () => {
    const out = transpile(CODE_WITH_HOISTING)
    expect(out.outputText).toMatchInlineSnapshot(`
      "jest.enableAutomock();
      jest.disableAutomock();
      jest.mock('./foo');
      jest.mock('./foo/bar', function () { return 'bar'; });
      jest.deepUnmock('./foo');
      jest.mock('./foo').mock('./bar');
      var foo = 'foo';
      console.log(foo);
      jest.unmock('./bar/foo').dontMock('./bar/bar');
      var func = function () {
          jest.unmock('./foo');
          jest.mock('./bar');
          jest.mock('./bar/foo', function () { return 'foo'; });
          jest.unmock('./foo/bar');
          jest.deepUnmock('./bar');
          jest.mock('./foo').mock('./bar');
          var bar = 'bar';
          console.log(bar);
          jest.unmock('./bar/foo').dontMock('./bar/bar');
      };
      var func2 = function () {
          jest.mock('./bar');
          jest.unmock('./foo/bar');
          jest.mock('./bar/foo', function () { return 'foo'; });
          jest.unmock('./foo');
          jest.deepUnmock('./bar');
          jest.mock('./foo').mock('./bar');
          var bar = 'bar';
          console.log(bar);
          jest.unmock('./bar/foo').dontMock('./bar/bar');
      };
      "
    `)
  })
})
