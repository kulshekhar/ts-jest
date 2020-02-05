import hello from './mock-unmock'

jest.mock('./mock-unmock')

const original = jest.requireActual('./mock-unmock').default
it('should have been mocked', () => {
  const msg = hello()
  expect(hello).not.toBe(original)
  expect(msg).toBeUndefined()
  expect(hello).toHaveProperty('mock')
  expect(require('foo')).toBe('bar')
  jest.mock('foo', () => 'bar', { virtual: true })
})
