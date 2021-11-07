import Foo from '../foo'

test('should pass', () => {
  expect(Foo.prototype.render().props.defaultMessage).toBeUndefined()
})
