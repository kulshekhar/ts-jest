import { HooEnum } from '../hoo-constant'

const getTwo = (): string => HooEnum.two

test('should pass', () => {
  expect(getTwo()).toBe('TWO')
})
