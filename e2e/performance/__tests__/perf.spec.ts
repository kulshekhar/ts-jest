import { double } from '../src/value'

test('transforms TypeScript', () => {
  expect(double(21)).toBe(42)
})
