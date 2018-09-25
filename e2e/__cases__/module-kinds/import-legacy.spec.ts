import lib = require('./lib')

test('import default', () => {
  expect(typeof lib).toBe('function')
  expect(lib()).toBe('foo')
  expect(lib.bar).toBe('bar')
})
