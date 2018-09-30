test('spread', () => {
  expect({ ...{ bar: 'foo' }, foo: 'bar' }).toEqual({ foo: 'bar', bar: 'foo' })
})
