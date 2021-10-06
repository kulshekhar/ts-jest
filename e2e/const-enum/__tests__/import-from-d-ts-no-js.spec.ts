import { HooConstEnum } from '../hoo-constant'

const getTwo = (): string => HooConstEnum.two

test('should pass', () => {
  expect(getTwo()).toBe('TWO')
})
