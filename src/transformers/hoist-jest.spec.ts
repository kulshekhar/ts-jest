import { testing } from 'bs-logger'
import * as tsc from 'typescript'

import * as hoist from './hoist-jest'

const CODE_WITH_HOISTING = `
const foo = 'foo'
console.log(foo)
jest.mock('./foo')
jest.mock('./foo/bar', () => 'bar')
const func = () => {
  const bar = 'bar'
  console.log(bar)
  jest.unmock('./foo')
  jest.mock('./bar')
  jest.mock('./bar/foo', () => 'foo')
  jest.unmock('./foo/bar')
}
const func2 = () => {
  const bar = 'bar'
  console.log(bar)
  jest.mock('./bar')
  jest.unmock('./foo/bar')
  jest.mock('./bar/foo', () => 'foo')
  jest.unmock('./foo')
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

  it('should hoist jest mock() and unmock() statements', () => {
    const out = transpile(CODE_WITH_HOISTING)
    expect(out.outputText).toMatchInlineSnapshot(`
"jest.mock('./foo');
jest.mock('./foo/bar', function () { return 'bar'; });
var foo = 'foo';
console.log(foo);
var func = function () {
    jest.unmock('./foo');
    jest.mock('./bar');
    jest.mock('./bar/foo', function () { return 'foo'; });
    jest.unmock('./foo/bar');
    var bar = 'bar';
    console.log(bar);
};
var func2 = function () {
    jest.mock('./bar');
    jest.unmock('./foo/bar');
    jest.mock('./bar/foo', function () { return 'foo'; });
    jest.unmock('./foo');
    var bar = 'bar';
    console.log(bar);
};
"
`)
  })
})
