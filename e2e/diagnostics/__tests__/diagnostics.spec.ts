import { Thing } from '../foo'

const thing: Thing = { a: 1 }

test('thing is { a: 1 }', () => {
  expect(thing).toEqual({ a: 1 })
})
