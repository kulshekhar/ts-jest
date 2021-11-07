import { BarConstEnum } from '../bar-constant'

const getOne = (): string => BarConstEnum.one

test('should pass', () => {
  expect(getOne()).toBe('ONE')
})
