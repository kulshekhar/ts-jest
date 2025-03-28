import { BarEnum } from '../src/bar-constant'

const getOne = (): string => BarEnum.one

describe('enum', () => {
  it('should pass', () => {
    expect(getOne()).toBe('ONE')
  })
})
