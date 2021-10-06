import bar = require('../../bar')
import barDefault from '../../bar-default'
import barInvalidType from '../../bar-invalid-type'
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

test('bar invalid type', () => {
  expect(barInvalidType).toBe(3.14)
})
