import { divide } from '~'
import { divide as _divide } from '~/divide'

test('imports same divide function', () => {
  expect(_divide).toBe(divide)
})

test('divides 3 / 2 to equal 1.5', () => {
  expect(divide(3, 2)).toBe(1.5)
})
