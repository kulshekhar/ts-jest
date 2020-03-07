import { g } from './main'

it('should pass', () => {
  const x: string = g(5)
  expect(x).toBe(5)
})
