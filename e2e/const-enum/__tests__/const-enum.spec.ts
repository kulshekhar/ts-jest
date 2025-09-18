import { BarConstEnum } from '../src/bar-constant'
import { FooConstEnum } from '../src/foo-constant'

const getOne = (): string => BarConstEnum.one
const getTwo = (): string => FooConstEnum.two

describe('const-enum', () => {
  it('should pass', () => {
    expect(getOne()).toBe('ONE')
    expect(getTwo()).toBe('TWO')
  })
})
