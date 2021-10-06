import type { Foo } from '@share/foo'

test('should work', () => {
  const a: Foo = {
    bar: 1,
  }

  expect(a).toBeTruthy()
})
