import { foo } from './foo'

describe('foo', () => {
  it('should return "foo"', () => {
    expect(foo()).toEqual('foo')
  })
})
