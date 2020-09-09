import Unmocked from './__test_modules__/Unmocked'
import Mocked from './__test_modules__/Mocked'
import b from './__test_modules__/b'
import c from './__test_modules__/c'
import d from './__test_modules__/d'

// These will all be hoisted above imports
jest.deepUnmock('./__test_modules__/Unmocked')
jest.unmock('./__test_modules__/c').unmock('./__test_modules__/d')

let e: any;
(function () {
  const _getJestObj = 42;
  e = require('./__test_modules__/e').default;
  // hoisted to the top of the function scope
  jest.unmock('./__test_modules__/e')
})();

// These will not be hoisted
jest.unmock('./__test_modules__/a').dontMock('./__test_modules__/b')
jest.unmock('./__test_modules__/' + 'a')
jest.dontMock('./__test_modules__/Mocked')

it('hoists unmocked modules before imports', () => {
  // @ts-expect-error
  expect(Unmocked._isMockFunction).toBeUndefined()
  expect(new Unmocked().isUnmocked).toEqual(true)

  // @ts-expect-error
  expect(c._isMockFunction).toBeUndefined()
  expect(c()).toEqual('unmocked')

  // @ts-expect-error
  expect(d._isMockFunction).toBeUndefined()
  expect(d()).toEqual('unmocked')

  expect(e._isMock).toBe(undefined)
  expect(e()).toEqual('unmocked')
});

it('does not hoist dontMock calls before imports', () => {
  // @ts-expect-error
  expect(Mocked._isMockFunction).toBe(true)
  expect(new Mocked().isMocked).toEqual(undefined)

  // @ts-expect-error
  expect(b._isMockFunction).toBe(true)
  expect(b()).toEqual(undefined)
});
