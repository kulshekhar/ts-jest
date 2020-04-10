import { myLibraryFunction } from './'

test('myLibraryFunction', () => {
  const result = myLibraryFunction()

  expect(result).toHaveProperty('foo')
  expect(typeof result.foo).toBe('string')

  expect(result).toHaveProperty('bar')
  expect(typeof result.bar).toBe('number')
})
