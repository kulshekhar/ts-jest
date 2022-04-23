import { FooEnum } from '../hoo-constant'

const getTwo = (): string => FooEnum.two

test('should pass', () => {
  expect(getTwo()).toBe('TWO')
})
