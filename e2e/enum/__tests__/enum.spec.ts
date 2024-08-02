import { BarEnum } from '../src/bar-constant'
import { FooEnum } from '../src/foo-constant'

const getOne = (): string => BarEnum.one
const getTwo = (): string => FooEnum.two

describe('enum', () => {
  it('should pass', () => {
    expect(getOne()).toBe('ONE')
    expect(getTwo()).toBe('TWO')
  })
})
