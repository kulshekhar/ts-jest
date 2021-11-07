import { BarEnum } from '../bar-constant'

const getOne = (): string => BarEnum.one

test('should pass', () => {
  expect(getOne()).toBe('ONE')
})
