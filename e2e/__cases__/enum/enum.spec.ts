import { MyEnum } from './constants'

it('should pass', () => {
  expect(MyEnum.one).toBe('ONE')
  expect(MyEnum.two).toBe('TWO')
})
