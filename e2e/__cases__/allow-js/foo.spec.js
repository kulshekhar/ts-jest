const foo = require('./foo')
const bar = require('./bar')

test('foo', () => {
  expect(foo).toBe('FOO!')
})

test('bar', () => {
  expect(bar).toBe('BAR!')
})
