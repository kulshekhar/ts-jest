import bar = require('../../bar')
import barDefault from '../../bar-default'
import { fooESM } from '../../foo-esm'

test('foo esm', () => {
  expect(fooESM).toBe('FOO-ESM!')
})

test('bar', () => {
  expect(bar).toBe('BAR!')
})

test('bar default', () => {
  expect(barDefault).toBe('BAR-DEFAULT!')
})
