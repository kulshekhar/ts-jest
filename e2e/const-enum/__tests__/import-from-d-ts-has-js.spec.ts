import { FooConstEnum } from '../foo-constant'

const getTwo = (): string => FooConstEnum.two

test('should pass', () => {
  expect(getTwo()).toBe('TWO')
})
