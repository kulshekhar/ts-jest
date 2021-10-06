const value = await Promise.resolve('hello!')

test('supports top level await', () => {
  expect(value).toBe('hello!')
})
