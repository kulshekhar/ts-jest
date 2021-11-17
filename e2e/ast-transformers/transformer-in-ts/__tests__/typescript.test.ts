import { color } from '../entry'

jest.mock('../entry', () => {
  return { color: 'blue' }
})

test('should use custom AST transformer written in ts', () => {
  expect(color).toBe('blue')
})
