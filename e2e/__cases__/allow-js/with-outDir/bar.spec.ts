import * as foo from './foo'
import bar = require('./bar')

test('foo', () => {
  expect(foo).toBe('FOO!')
})

test('bar', () => {
  expect(bar).toBe('BAR!')
})
