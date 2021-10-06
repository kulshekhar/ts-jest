import { double } from '../double'

test('double', () => {
  expect(double(2)).toBe(4)
})

test('import.meta', () => {
  expect(typeof import.meta.url).toBe('string')
})
